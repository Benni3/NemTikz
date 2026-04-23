import { Handle, Position, type NodeProps } from '@xyflow/react'

export function JunctionNode(_props: NodeProps) {
  const commonStyle: React.CSSProperties = {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'transparent',
    border: 'none',
  }

  return (
    <div
      style={{
        width: 12,
        height: 12,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Handle id="t-left" type="target" position={Position.Left} style={commonStyle} />
      <Handle id="s-left" type="source" position={Position.Left} style={commonStyle} />

      <Handle id="t-right" type="target" position={Position.Right} style={commonStyle} />
      <Handle id="s-right" type="source" position={Position.Right} style={commonStyle} />

      <Handle id="t-top" type="target" position={Position.Top} style={commonStyle} />
      <Handle id="s-top" type="source" position={Position.Top} style={commonStyle} />

      <Handle id="t-bottom" type="target" position={Position.Bottom} style={commonStyle} />
      <Handle id="s-bottom" type="source" position={Position.Bottom} style={commonStyle} />

      <svg width="12" height="12" viewBox="0 0 12 12">
        <circle cx="6" cy="6" r="4" fill="#111" />
      </svg>
    </div>
  )
}