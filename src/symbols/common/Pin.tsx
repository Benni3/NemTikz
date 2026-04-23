import { Handle, Position } from '@xyflow/react'
import type { PointerEventHandler } from 'react'

type PinProps = {
  id: string
  handleType: 'source' | 'target'
  position: Position
  top?: string
  left?: string
  right?: string
  bottom?: string
  onPointerDown?: PointerEventHandler<HTMLDivElement>
}

export default function Pin({
  id,
  handleType,
  position,
  top,
  left,
  right,
  bottom,
  onPointerDown,
}: PinProps) {
  return (
    <>
      <Handle
        id={id}
        type={handleType}
        position={position}
        style={{
          width: 1,
          height: 1,
          opacity: 0,
          border: 'none',
          background: 'transparent',
          top,
          left,
          right,
          bottom,
          pointerEvents: 'none',
        }}
      />

      <div
        className="nodrag nopan"
        onPointerDown={(e) => {
          e.stopPropagation()
          e.preventDefault()
          onPointerDown?.(e)
        }}
        style={{
          position: 'absolute',
          width: 26,
          height: 26,
          top,
          left,
          right,
          bottom,
          transform: 'translate(-50%, -50%)',
          cursor: 'crosshair',
          zIndex: 40,
          background: 'transparent',
        }}
      />
    </>
  )
}