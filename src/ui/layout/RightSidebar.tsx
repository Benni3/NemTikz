import { useState } from 'react'
import type { SymbolNodeData } from '../../symbols/types'
import type { Edge, Node } from '@xyflow/react'
import type {
  OrthogonalEdgeData,
  OrthogonalEdgeSegmentStyle,
} from '../../wires/OrthogonalEdge'

type SelectedSegment = {
  kind: 'edge' | 'partial'
  id: string
  segmentIndex: number
}

type RightSidebarProps = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  selectedNode: Node<SymbolNodeData> | null
  selectedEdge: Edge<OrthogonalEdgeData> | null
  selectedSegments: SelectedSegment[]
  codeValue: string
  onCodeChange: (value: string) => void
  onResetCode: () => void
  onUpdateSelectedNodeData: (patch: Partial<SymbolNodeData>) => void
  onUpdateSelectedEdgeData: (patch: Partial<OrthogonalEdgeData>) => void
  selectedSegmentStyle: OrthogonalEdgeSegmentStyle | null
  onUpdateSelectedSegmentsStyle: (
    patch: Partial<OrthogonalEdgeSegmentStyle>
  ) => void
}

const WIDTH_OPEN = 340
const WIDTH_CLOSED = 52

const COLOR_OPTIONS = [
  '#111111', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
  '#ff0000', '#ff5555', '#ff9900', '#ffaa00', '#ffff00', '#ffee88',
  '#00aa00', '#55ff55', '#00ffaa', '#00ffff', '#00aaff', '#0000ff',
  '#5555ff', '#9900ff', '#aa55ff', '#ff00aa', '#ff55cc', '#8b4513',
]

function isValidHex(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value)
}

function normalizeHex(value: string) {
  const cleaned = value.trim()
  if (cleaned.startsWith('#')) return cleaned
  return `#${cleaned}`
}

function ColorSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [customHex, setCustomHex] = useState(value)

  const safeValue = isValidHex(value) ? value : '#111111'
  const normalizedCustomHex = normalizeHex(customHex)
  const customIsValid = isValidHex(normalizedCustomHex)

  function applyCustomHex() {
    if (!customIsValid) return
    onChange(normalizedCustomHex.toLowerCase())
    setOpen(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setCustomHex(safeValue)
          setOpen((prev) => !prev)
        }}
        style={{
          width: '100%',
          height: 36,
          border: '1px solid #d8d8d8',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          padding: '0 10px',
          cursor: 'pointer',
          background: '#fff',
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: 4,
            background: safeValue,
            border: '1px solid #aaa',
            marginRight: 10,
          }}
        />
        <span style={{ fontSize: 13 }}>{safeValue}</span>
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 42,
            left: 0,
            width: '100%',
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: 10,
            padding: 8,
            zIndex: 9999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 6,
              marginBottom: 10,
            }}
          >
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onChange(color)
                  setOpen(false)
                }}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: 6,
                  background: color,
                  border:
                    safeValue.toLowerCase() === color.toLowerCase()
                      ? '2px solid #111'
                      : '1px solid #ccc',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              value={customHex}
              placeholder="#123abc"
              onChange={(e) => setCustomHex(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyCustomHex()
              }}
              style={{
                flex: 1,
                height: 34,
                border: customIsValid ? '1px solid #d8d8d8' : '1px solid #d33',
                borderRadius: 8,
                padding: '0 8px',
                boxSizing: 'border-box',
                fontFamily: 'monospace',
              }}
            />

            <button
              type="button"
              disabled={!customIsValid}
              onClick={applyCustomHex}
              style={{
                height: 34,
                padding: '0 10px',
                border: '1px solid #ccc',
                borderRadius: 8,
                background: customIsValid ? '#111' : '#eee',
                color: customIsValid ? '#fff' : '#888',
                cursor: customIsValid ? 'pointer' : 'not-allowed',
              }}
            >
              Apply
            </button>
          </div>

          <div
            style={{
              marginTop: 8,
              height: 24,
              borderRadius: 6,
              border: '1px solid #ddd',
              background: customIsValid ? normalizedCustomHex : '#fff',
            }}
          />
        </div>
      )}
    </div>
  )
}

export default function RightSidebar({
  open,
  setOpen,
  selectedNode,
  selectedEdge,
  codeValue,
  onCodeChange,
  onResetCode,
  onUpdateSelectedNodeData,
  onUpdateSelectedEdgeData,
  selectedSegments,
  onUpdateSelectedSegmentsStyle,
  selectedSegmentStyle,
}: RightSidebarProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'code'>('edit')
  const [copiedCode, setCopiedCode] = useState(false)

  const sidebarWidth = open ? WIDTH_OPEN : WIDTH_CLOSED

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 36,
    border: '1px solid #d8d8d8',
    borderRadius: 8,
    padding: '0 10px',
    boxSizing: 'border-box',
    background: '#fff',
    color: '#111111',
    WebkitTextFillColor: '#111111',
    }

    const selectedData = selectedNode?.data ?? {}

  const currentScale =
  typeof selectedData.scale === 'number'
    ? selectedData.scale
    : 1

  const [isSliding, setIsSliding] = useState(false)

  const label = typeof selectedData.label === 'string' ? selectedData.label : ''
  const labelColor =
    typeof selectedData.labelColor === 'string'
      ? selectedData.labelColor
      : '#111111'
  const labelSize =
    typeof selectedData.labelSize === 'number' ? selectedData.labelSize : 14
  const labelOffsetX =
    typeof selectedData.labelOffsetX === 'number' ? selectedData.labelOffsetX : 0
  const labelOffsetY =
    typeof selectedData.labelOffsetY === 'number' ? selectedData.labelOffsetY : 0

  const selectedEdgeData = selectedEdge?.data ?? {}
  const edgeColor =
    typeof selectedEdgeData.stroke === 'string' ? selectedEdgeData.stroke : '#111111'
  const edgeWidth =
    typeof selectedEdgeData.strokeWidth === 'number' ? selectedEdgeData.strokeWidth : 2

    const segmentColor =
  typeof selectedSegmentStyle?.stroke === 'string'
    ? selectedSegmentStyle.stroke
    : '#111111'

const segmentThickness =
  typeof selectedSegmentStyle?.strokeWidth === 'number'
    ? selectedSegmentStyle.strokeWidth
    : 2

const segmentLabel =
  typeof selectedSegmentStyle?.label === 'string'
    ? selectedSegmentStyle.label
    : ''

const segmentLabelColor =
  typeof selectedSegmentStyle?.labelColor === 'string'
    ? selectedSegmentStyle.labelColor
    : '#111111'

const segmentLabelSize =
  typeof selectedSegmentStyle?.labelSize === 'number'
    ? selectedSegmentStyle.labelSize
    : 14
    
    
const segmentLabelOffsetX =
  typeof selectedSegmentStyle?.labelOffsetX === 'number'
    ? selectedSegmentStyle.labelOffsetX
    : 0

const segmentLabelOffsetY =
  typeof selectedSegmentStyle?.labelOffsetY === 'number'
    ? selectedSegmentStyle.labelOffsetY
    : -8


async function copyCodeToClipboard() {
  await navigator.clipboard.writeText(codeValue)

  setCopiedCode(true)

  setTimeout(() => {
    setCopiedCode(false)
  }, 2000)
}
    

    function getColorValue(
  event: React.FormEvent<HTMLInputElement>
): string {
  return event.currentTarget.value
}



  return (
    <aside
      style={{
        position: 'absolute',
        top: 68,
        right: 0,
        bottom: 0,
        width: sidebarWidth,
        background: '#fafafa',
        borderLeft: '1px solid #ddd',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.18s ease',
        overflow: 'hidden',
        minWidth: 0,
      }}
    >
      <div
        style={{
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'space-between' : 'center',
          padding: open ? '0 12px' : '0',
          borderBottom: '1px solid #e5e5e5',
          flexShrink: 0,
        }}
      >
        {open && (
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#222',
            }}
          >
            Inspector
          </span>
        )}

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          style={{
            width: 32,
            height: 32,
            border: '1px solid #ccc',
            borderRadius: 8,
            background: '#fff',
            cursor: 'pointer',
            fontSize: 16,
          }}
        >
          {open ? '›' : '‹'}
        </button>
      </div>

      {open && (
        <>
          <div
            style={{
              display: 'flex',
              gap: 8,
              padding: '10px 12px',
              borderBottom: '1px solid #ececec',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              style={{
                flex: 1,
                height: 36,
                border: '1px solid #d0d0d0',
                borderRadius: 8,
                background: activeTab === 'edit' ? '#111' : '#fff',
                color: activeTab === 'edit' ? '#fff' : '#111',
                cursor: 'pointer',
              }}
            >
              Edit Component
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('code')}
              style={{
                flex: 1,
                height: 36,
                border: '1px solid #d0d0d0',
                borderRadius: 8,
                background: activeTab === 'code' ? '#111' : '#fff',
                color: activeTab === 'code' ? '#fff' : '#111',
                cursor: 'pointer',
              }}
            >
              LaTeX Code
            </button>
          </div>

          <div
            style={{
                flex: 1,              
                minHeight: 0,         
                overflowY: 'auto',
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
            }}
            >
            {activeTab === 'edit' && (
              <>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#666',
                      marginBottom: 6,
                    }}
                  >
                    Selected component
                  </div>

                  <div
                    style={{
                      padding: 10,
                      border: '1px solid #ddd',
                      borderRadius: 10,
                      background: '#fff',
                      fontSize: 14,
                    }}
                  >
                    {selectedNode ? selectedNode.type : 'No component selected'}
                  </div>
                        </div>

                        {selectedNode ? (
                        <>
                            <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 6 }}>
                                Outside line color
                            </div>
                            <ColorSelect
                                value={
                                typeof selectedNode.data.strokeColor === 'string'
                                    ? selectedNode.data.strokeColor
                                    : '#111111'
                                }
                                onChange={(color) => onUpdateSelectedNodeData({ strokeColor: color })}
                            />
                            </div>

                            <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 6 }}>
                                Line thickness
                            </div>
                            <input
                                type="number"
                                value={
                                    typeof selectedNode.data.strokeWidth === 'number'
                                    ? selectedNode.data.strokeWidth
                                    : 2
                                }
                                min={1}
                                max={10}
                                onChange={(e) =>
                                    onUpdateSelectedNodeData({
                                    strokeWidth: Number(e.target.value) || 2,
                                    })
                                }
                                style={inputStyle}
                                />
                            </div>

                            <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 6 }}>
                                Inside fill color
                            </div>
                            <ColorSelect
                                value={
                                typeof selectedNode.data.fillColor === 'string'
                                    ? selectedNode.data.fillColor
                                    : '#ffffff'
                                }
                                onChange={(color) => onUpdateSelectedNodeData({ fillColor: color })}
                            />
                            </div>

<div>
  <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 8 }}>
    Scale
  </div>

  <div
    style={{
      position: 'relative',
      height: 34,
      borderRadius: 999,
      background: '#e5e5e5',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: `${((currentScale - 1) / 9) * 100}%`,
        background: '#111',
        borderRadius: 999,
        transition: 'width 0.12s ease',
      }}
    />

    <input
      type="range"
      min={1}
      max={10}
      step={1}
      value={currentScale}
      onChange={(e) =>
        onUpdateSelectedNodeData({
          scale: Number(e.target.value),
        })
      }
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: 0,
        cursor: 'pointer',
      }}
    />

    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        color: '#fff',
        fontSize: 13,
        fontWeight: 800,
        mixBlendMode: 'difference',
      }}
    >
      {currentScale}
    </div>
  </div>
</div>

                            <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 6 }}>
                                Label text
                            </div>
                            <input
                                type="text"
                                value={label}
                                onChange={(e) =>
                                    onUpdateSelectedNodeData({
                                    label: e.target.value,
                                    })
                                }
                                style={inputStyle}
                                />
                            </div>

                            <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 6 }}>
                                Label color
                            </div>
                            <ColorSelect
                                value={labelColor}
                                onChange={(color) => onUpdateSelectedNodeData({ labelColor: color })}
                            />
                            </div>

                            <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 6 }}>
                                Label size
                            </div>
                            <input
                                type="number"
                                value={labelSize}
                                min={8}
                                max={60}
                                onChange={(e) =>
                                    onUpdateSelectedNodeData({
                                    labelSize: Number(e.target.value) || 14,
                                    })
                                }
                                style={inputStyle}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 6 }}>
                                Offset X
                                </div>
                                <input
                                type="number"
                                value={labelOffsetX}
                                onChange={(e) =>
                                    onUpdateSelectedNodeData({ labelOffsetX: Number(e.target.value) || 0 })
                                }
                                style={{
                                    width: '100%',
                                    height: 36,
                                    border: '1px solid #d8d8d8',
                                    borderRadius: 8,
                                    padding: '0 10px',
                                    boxSizing: 'border-box',
                                    background: '#fff',
                                }}
                                />
                            </div>

                            <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 6 }}>
                                Offset Y
                                </div>
                                <input
                                type="number"
                                value={labelOffsetY}
                                onChange={(e) =>
                                    onUpdateSelectedNodeData({ labelOffsetY: Number(e.target.value) || 0 })
                                }
                                style={{
                                    width: '100%',
                                    height: 36,
                                    border: '1px solid #d8d8d8',
                                    borderRadius: 8,
                                    padding: '0 10px',
                                    boxSizing: 'border-box',
                                    background: '#fff',
                                }}
                                />
                            </div>
                            </div>

                            {['andGate', 'nandGate', 'orGate', 'norGate', 'xorGate', 'xnorGate'].includes(
                                selectedNode.type ?? ''
                                ) && (
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 6 }}>
                                    Input count
                                    </div>

                                    <input
                                    type="number"
                                    min={2}
                                    max={8}
                                    value={
                                        typeof selectedNode.data.inputCount === 'number'
                                        ? selectedNode.data.inputCount
                                        : 2
                                    }
                                    onChange={(e) =>
                                        onUpdateSelectedNodeData({
                                        inputCount: Math.max(2, Number(e.target.value) || 2),
                                        })
                                    }
                                    style={inputStyle}
                                    />
                                </div>
                                )}

                                {selectedNode.type === 'muxGate' && (
                                <div
                                  style={{
                                    border: '1px solid #e5e5e5',
                                    borderRadius: 12,
                                    padding: 12,
                                    background: '#fff',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 14,
                                  }}
                                >
                                  {/* SECTION TITLE */}
                                  <div
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 700,
                                      color: '#333',
                                    }}
                                  >
                                    Multiplexer Settings
                                  </div>

                                  {/* SELECT WIDTH */}
                                  <div>
                                    <div
                                      style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: '#666',
                                        marginBottom: 6,
                                      }}
                                    >
                                      Select bits
                                    </div>

                                    <input
                                      type="number"
                                      min={1}
                                      max={4}
                                      value={
                                        typeof selectedNode.data.selectWidth === 'number'
                                          ? selectedNode.data.selectWidth
                                          : 1
                                      }
                                      onChange={(e) =>
                                        onUpdateSelectedNodeData({
                                          selectWidth: Math.max(1, Number(e.target.value) || 1),
                                        })
                                      }
                                      style={inputStyle}
                                    />
                                  </div>

                                  {/* POSITION + ENCODING ROW */}
                                  <div
                                    style={{
                                      display: 'grid',
                                      gridTemplateColumns: '1fr 1fr',
                                      gap: 10,
                                      alignItems: 'end',
                                    }}
                                  >
                                    {/* SELECT POSITION */}
                                    <div>
                                      <div
                                        style={{
                                          fontSize: 12,
                                          fontWeight: 600,
                                          color: '#666',
                                          marginBottom: 6,
                                        }}
                                      >
                                        Position
                                      </div>

                                      <select
                                        value={
                                          selectedNode.data.selectPosition === 'top'
                                            ? 'top'
                                            : 'bottom'
                                        }
                                        onChange={(e) =>
                                          onUpdateSelectedNodeData({
                                            selectPosition: e.target.value as 'top' | 'bottom',
                                          })
                                        }
                                        style={inputStyle}
                                      >
                                        <option value="bottom">Bottom</option>
                                        <option value="top">Top</option>
                                      </select>
                                    </div>

                                    {/* ENCODING TOGGLE */}
                                    <div>
                                      <div
                                        style={{
                                          fontSize: 12,
                                          fontWeight: 600,
                                          color: '#666',
                                          marginBottom: 6,
                                        }}
                                      >
                                        Encoding
                                      </div>

                                      <label
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 8,
                                          cursor: 'pointer',
                                          height: 36,
                                          border: '1px solid #d8d8d8',
                                          borderRadius: 8,
                                          padding: '0 10px',
                                          background: '#fff',
                                        }}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={!!selectedNode.data.showSelectEncoding}
                                          onChange={(e) =>
                                            onUpdateSelectedNodeData({
                                              showSelectEncoding: e.target.checked,
                                            })
                                          }
                                        />
                                        <span style={{ fontSize: 13 }}>Show</span>
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              )}
                        </>
                        ) :  selectedSegments.length > 0 ? (
                        <>
                            <div>
                            <div
                                style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#666',
                                marginBottom: 6,
                                }}
                            >
                                Selected wire segments
                            </div>
                            <div
                                style={{
                                padding: 10,
                                border: '1px solid #ddd',
                                borderRadius: 10,
                                background: '#fff',
                                fontSize: 14,
                                }}
                            >
                                {selectedSegments.length} segment(s)
                            </div>
                            </div>
                            <div>
                            <div
                                style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#666',
                                marginBottom: 6,
                                }}
                            >
                                Segment color
                            </div>
                            <ColorSelect
                                value={segmentColor}
                                onChange={(color) =>
                                    onUpdateSelectedSegmentsStyle({
                                    stroke: color,
                                    })
                                }
                                />
                            </div>
                            <div>
                            <div
                                style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#666',
                                marginBottom: 6,
                                }}
                            >
                                Segment thickness
                            </div>
                            <input
                                type="number"
                                min={1}
                                max={12}
                                value={segmentThickness}
                                onChange={(e) =>
                                onUpdateSelectedSegmentsStyle({
                                    strokeWidth: Number(e.target.value) || 2,
                                })
                                }
                                style={{
                                width: '100%',
                                height: 36,
                                border: '1px solid #d8d8d8',
                                borderRadius: 8,
                                padding: '0 10px',
                                boxSizing: 'border-box',
                                background: '#fff',
                                }}
                            />
                            </div>
                            <div>
                            <div
                                style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#666',
                                marginBottom: 6,
                                }}
                                
                            >
                                Segment label
                            </div>
                            <input
                                type="text"
                                value={segmentLabel}
                                onChange={(e) =>
                                    onUpdateSelectedSegmentsStyle({
                                    label: e.target.value,
                                    })
                                }
                                style={inputStyle}
                                />
                            </div>
                            <div>
                            <div
                                style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#666',
                                marginBottom: 6,
                                }}
                            >
                                Label color
                            </div>
                            <ColorSelect
                                value={segmentLabelColor}
                                onChange={(color) =>
                                    onUpdateSelectedSegmentsStyle({
                                    labelColor: color,
                                    })
                                }
                                />
                            </div>
                            <div>
                            <div
                                style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#666',
                                marginBottom: 6,
                                }}
                            >
                                Label size
                            </div>
                            <input
                                type="number"
                                min={8}
                                max={40}
                                value={segmentLabelSize}
                                onChange={(e) =>
                                onUpdateSelectedSegmentsStyle({
                                    labelSize: Number(e.target.value) || 14,
                                })
                                }
                                style={{
                                width: '100%',
                                height: 36,
                                border: '1px solid #d8d8d8',
                                borderRadius: 8,
                                padding: '0 10px',
                                boxSizing: 'border-box',
                                background: '#fff',
                                }}
                            />
                            </div>
                            <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: 10,
                            }}
                            >
                            <div>
                                <div
                                style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: '#666',
                                    marginBottom: 6,
                                }}
                                >
                                Label offset X
                                </div>
                                <input
                                type="number"
                                value={segmentLabelOffsetX}
                                onChange={(e) =>
                                    onUpdateSelectedSegmentsStyle({
                                    labelOffsetX: Number(e.target.value) || 0,
                                    })
                                }
                                style={{
                                    width: '100%',
                                    height: 36,
                                    border: '1px solid #d8d8d8',
                                    borderRadius: 8,
                                    padding: '0 10px',
                                    boxSizing: 'border-box',
                                    background: '#fff',
                                }}
                                />
                            </div>
                            <div>
                                <div
                                style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: '#666',
                                    marginBottom: 6,
                                }}
                                >
                                Label offset Y
                                </div>
                                <input
                                type="number"
                                value={segmentLabelOffsetY}
                                onChange={(e) =>
                                    onUpdateSelectedSegmentsStyle({
                                    labelOffsetY: Number(e.target.value) || 0,
                                    })
                                }
                                style={{
                                    width: '100%',
                                    height: 36,
                                    border: '1px solid #d8d8d8',
                                    borderRadius: 8,
                                    padding: '0 10px',
                                    boxSizing: 'border-box',
                                    background: '#fff',
                                }}
                                />
                            </div>
                            </div>
                        </>
                
                ) : selectedEdge ? (
                    <>
                        <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 6 }}>
                            Wire color
                        </div>
                        <ColorSelect
                            value={edgeColor}
                            onChange={(color) =>
                                onUpdateSelectedEdgeData({
                                stroke: color,
                                })
                            }
                            />
                        </div>
                        <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 6 }}>
                            Wire thickness
                        </div>
                        <input
                            type="number"
                            min={1}
                            max={12}
                            value={edgeWidth}
                            onChange={(e) =>
                            onUpdateSelectedEdgeData({
                                strokeWidth: Number(e.target.value) || 2,
                            })
                            }
                            style={{
                            width: '100%',
                            height: 36,
                            border: '1px solid #d8d8d8',
                            borderRadius: 8,
                            padding: '0 10px',
                            boxSizing: 'border-box',
                            background: '#fff',
                            }}
                        />
                        </div>
                    </>
                    ) : (
                  <div
                    style={{
                      fontSize: 13,
                      color: '#777',
                      lineHeight: 1.5,
                    }}
                  >
                    Select one component to edit its label settings.
                  </div>
                )}
              </>
            )}

            {activeTab === 'code' && (
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >

                <textarea
                  value={codeValue}
                  onChange={(e) => onCodeChange(e.target.value)}
                  spellCheck={false}
                  style={{
                    width: '100%',
                    flex: 1,
                    minHeight: 0,
                    resize: 'none',
                    border: '1px solid #d8d8d8',
                    borderRadius: 10,
                    padding: 12,
                    boxSizing: 'border-box',
                    background: '#fff',
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                    fontSize: 13,
                    lineHeight: 1.45,
                  }}
                />

                <button
                  type="button"
                  onClick={copyCodeToClipboard}
                  style={{
                    width: '100%',
                    height: 42,
                    borderRadius: 8,
                    border: copiedCode ? '1px solid #111' : '1px solid #111',
                    background: copiedCode ? '#fff' : '#111',
                    color: copiedCode ? '#111' : '#fff',
                    cursor: 'pointer',
                    fontWeight: 700,
                    transition: 'all 0.18s ease',
                    flexShrink: 0,
                  }}
                >
                  {copiedCode ? '✓ Copied' : 'Copy LaTeX code'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  )
}