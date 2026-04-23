import type React from 'react'

type TopToolbarProps = {
  deleteMode: boolean
  canUndo: boolean
  canRedo: boolean
  canDelete: boolean
  canRotate: boolean
  onToggleDeleteMode: () => void
  onDelete: () => void
  onUndo: () => void
  onRedo: () => void
  onExportTikz: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  sidebarOpen: boolean
  rightSidebarOpen: boolean
  onRotateClockwise: () => void
  onRotateCounterClockwise: () => void
}

const LEFT_WIDTH_OPEN = 260
const LEFT_WIDTH_CLOSED = 52

const RIGHT_WIDTH_OPEN = 340
const RIGHT_WIDTH_CLOSED = 52

const buttonStyle: React.CSSProperties = {
  height: 38,
  padding: '0 14px',
  border: '1px solid #cfcfcf',
  background: '#ffffff',
  color: '#111',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 14,
  whiteSpace: 'nowrap',
}

const activeButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: '#111',
  color: '#fff',
  borderColor: '#111',
}

const disabledButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  opacity: 0.45,
  cursor: 'not-allowed',
}

const dividerStyle: React.CSSProperties = {
  width: 1,
  height: 28,
  background: '#d9d9d9',
  margin: '0 4px',
  flexShrink: 0,
}

export default function TopToolbar({
  deleteMode,
  canUndo,
  canRedo,
  canDelete,
  canRotate,
  onToggleDeleteMode,
  onDelete,
  onRotateClockwise,
  onRotateCounterClockwise,
  onUndo,
  onRedo,
  onExportTikz,
  onZoomIn,
  onZoomOut,
  sidebarOpen,
  rightSidebarOpen,
}: TopToolbarProps) {
  const leftOffset = sidebarOpen ? LEFT_WIDTH_OPEN : LEFT_WIDTH_CLOSED
  const rightOffset = rightSidebarOpen ? RIGHT_WIDTH_OPEN : RIGHT_WIDTH_CLOSED

  return (
    <div
      style={{
        position: 'absolute',
        top: 81,
        left: leftOffset + 40,
        right: rightOffset + 20,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        background: 'rgba(255,255,255,0.96)',
        border: '1px solid #d9d9d9',
        borderRadius: 12,
        boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
        transition: 'left 0.18s ease, right 0.18s ease',
        overflow: 'hidden',
        minWidth: 0, 
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          flexWrap: 'wrap',
          minWidth: 0,
        }}
      >
        <button
          type="button"
          onClick={onToggleDeleteMode}
          style={deleteMode ? activeButtonStyle : buttonStyle}
        >
          {deleteMode ? 'Delete: ON' : 'Delete: OFF'}
        </button>

        <button
          type="button"
          onClick={onDelete}
          style={canDelete ? buttonStyle : disabledButtonStyle}
          disabled={!canDelete}
        >
          Delete Selected
        </button>

        <div style={dividerStyle} />

        <button
          type="button"
          onClick={onUndo}
          style={canUndo ? buttonStyle : disabledButtonStyle}
          disabled={!canUndo}
        >
          Undo
        </button>

        <button
          type="button"
          onClick={onRedo}
          style={canRedo ? buttonStyle : disabledButtonStyle}
          disabled={!canRedo}
        >
          Redo
        </button>

        <div style={dividerStyle} />

        <button
          type="button"
          onClick={onRotateCounterClockwise}
          style={canRotate ? buttonStyle : disabledButtonStyle}
          disabled={!canRotate}
        >
          Rotate -90°
        </button>

        <button
          type="button"
          onClick={onRotateClockwise}
          style={canRotate ? buttonStyle : disabledButtonStyle}
          disabled={!canRotate}
        >
          Rotate +90°
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
          minWidth: 0,
        }}
      >
        <button type="button" style={buttonStyle} onClick={onZoomOut}>
          -
        </button>

        <button type="button" style={buttonStyle} onClick={onZoomIn}>
          +
        </button>

        <button type="button" style={buttonStyle}>
          Select
        </button>

        <button type="button" style={buttonStyle}>
          Label
        </button>

        <button type="button" style={buttonStyle}>
          Junction
        </button>

        <button type="button" style={buttonStyle} onClick={onExportTikz}>
          Export TikZ
        </button>
      </div>
    </div>
  )
}