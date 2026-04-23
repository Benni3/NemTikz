import { useState } from 'react'
import type { SymbolNodeData } from '../../symbols/types'
import type { Edge, Node } from '@xyflow/react'
import type { OrthogonalEdgeData } from '../../wires/OrthogonalEdge'

type RightSidebarProps = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  selectedNode: Node<SymbolNodeData> | null
  selectedEdge: Edge<OrthogonalEdgeData> | null
  codeValue: string
  onCodeChange: (value: string) => void
  onResetCode: () => void
  onUpdateSelectedNodeData: (patch: Partial<SymbolNodeData>) => void
  onUpdateSelectedEdgeData: (patch: Partial<OrthogonalEdgeData>) => void
}

const WIDTH_OPEN = 340
const WIDTH_CLOSED = 52

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
}: RightSidebarProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'code'>('edit')

  const sidebarWidth = open ? WIDTH_OPEN : WIDTH_CLOSED

  const selectedData = selectedNode?.data ?? {}

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
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#666',
                          marginBottom: 6,
                        }}
                      >
                        Label text
                      </div>
                      <input
                        type="text"
                        value={label}
                        onChange={(e) =>
                          onUpdateSelectedNodeData({ label: e.target.value })
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
                        Label color
                      </div>
                      <input
                        type="color"
                        value={labelColor}
                        onChange={(e) =>
                          onUpdateSelectedNodeData({
                            labelColor: e.target.value,
                          })
                        }
                        style={{
                          width: '100%',
                          height: 40,
                          border: '1px solid #d8d8d8',
                          borderRadius: 8,
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
                        Label size
                      </div>
                      <input
                        type="number"
                        value={labelSize}
                        onChange={(e) =>
                          onUpdateSelectedNodeData({
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
                          Offset X
                        </div>
                        <input
                          type="number"
                          value={labelOffsetX}
                          onChange={(e) =>
                            onUpdateSelectedNodeData({
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
                          Offset Y
                        </div>
                        <input
                          type="number"
                          value={labelOffsetY}
                          onChange={(e) =>
                            onUpdateSelectedNodeData({
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
                        <input
                            type="color"
                            value={edgeColor}
                            onChange={(e) =>
                            onUpdateSelectedEdgeData({
                                stroke: e.target.value,
                            })
                            }
                            style={{
                            width: '100%',
                            height: 40,
                            border: '1px solid #d8d8d8',
                            borderRadius: 8,
                            background: '#fff',
                            }}
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
              <>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={onResetCode}
                    style={{
                      height: 36,
                      padding: '0 12px',
                      border: '1px solid #ccc',
                      borderRadius: 8,
                      background: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    Refresh from diagram
                  </button>
                </div>

                <textarea
                  value={codeValue}
                  onChange={(e) => onCodeChange(e.target.value)}
                  spellCheck={false}
                  style={{
                    width: '100%',
                    minHeight: 520,
                    resize: 'vertical',
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
              </>
            )}
          </div>
        </>
      )}
    </aside>
  )
}