import type { NodeProps } from '@xyflow/react'

import {
  RECTANGLE_DEFAULT_WIDTH,
  RECTANGLE_DEFAULT_HEIGHT,
  getNodeWidth,
  getNodeHeight,
} from '../BlankGeometry'

export type BlankShapeData = {
  label?: string
  fillColor?: string
  strokeColor?: string
  strokeWidth?: number
  labelColor?: string
  labelSize?: number
  labelOffsetX?: number
  labelOffsetY?: number
  rotation?: 0 | 90 | 180 | 270

  width?: number
  height?: number
}

export function RectangleNode({
  data,
  selected,
}: NodeProps) {
  const nodeData = data as BlankShapeData

  const width = getNodeWidth(
    nodeData,
    RECTANGLE_DEFAULT_WIDTH
  )

  const height = getNodeHeight(
    nodeData,
    RECTANGLE_DEFAULT_HEIGHT
  )

  const fillColor = nodeData.fillColor ?? '#ffffff'
  const strokeColor = nodeData.strokeColor ?? '#111111'
  const strokeWidth = nodeData.strokeWidth ?? 2

  const label = nodeData.label ?? ''

  const labelColor = nodeData.labelColor ?? '#111111'
  const labelSize = nodeData.labelSize ?? 16

  const labelOffsetX = nodeData.labelOffsetX ?? 0
  const labelOffsetY = nodeData.labelOffsetY ?? 0

  const rotation = nodeData.rotation ?? 0

  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <div
        style={{
          width,
          height,
          background: fillColor,
          border: `${strokeWidth}px solid ${strokeColor}`,
          boxSizing: 'border-box',
          transform: `rotate(${rotation}deg)`,
          transformOrigin: `${width / 2}px ${height / 2}px`,
        }}
      />

      {selected && (
        <div
          className="nodrag"
          data-resize-handle="true"
          style={{
            position: 'absolute',
            right: -6,
            bottom: -6,
            width: 14,
            height: 14,
            borderRadius: 4,
            background: '#111',
            border: '2px solid #fff',
            cursor: 'nwse-resize',
            zIndex: 20,
          }}
        />
      )}

      {label && (
        <div
          style={{
            position: 'absolute',
            left: width / 2 + labelOffsetX,
            top: height / 2 + labelOffsetY,
            transform: 'translate(-50%, -50%)',
            color: labelColor,
            fontSize: labelSize,
            fontWeight: 600,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
      )}
    </div>
  )
}