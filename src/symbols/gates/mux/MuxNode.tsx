import { useEffect } from 'react'
import { Position, type NodeProps, useUpdateNodeInternals } from '@xyflow/react'
import Pin from '../../common/Pin'
import type { SymbolNodeData } from '../../types'
import { getSymbolStyle } from '../../common/symbolStyle'
import {
  MUX_GEOMETRY,
  getMuxGeometry,
  getMuxInputHandleId,
  getMuxPinAnchor,
  getMuxSelectHandleId,
  type MuxGeometry,
  type PinPoint,
  type SelectPosition,
} from './MuxGeometry'

export {
  MUX_GEOMETRY,
  getMuxGeometry,
  getMuxInputHandleId,
  getMuxPinAnchor,
  getMuxSelectHandleId,
}

export type { MuxGeometry, PinPoint, SelectPosition }

export type MuxNodeData = SymbolNodeData & {
  selectWidth?: number
  selectPosition?: SelectPosition
  showSelectEncoding?: boolean
  scale?: number
  rotation?: 0 | 90 | 180 | 270
}

function toGrayCode(n: number) {
  return n ^ (n >> 1)
}

function formatBinary(n: number, bits: number) {
  return n.toString(2).padStart(bits, '0')
}

function PinCircle({
  pin,
  showCircle,
  strokeColor,
  radius,
}: {
  pin: PinPoint
  showCircle: boolean
  strokeColor: string
  radius: number
}) {
  if (!showCircle) return null
  return <circle cx={pin.x} cy={pin.y} r={radius} fill={strokeColor} />
}

export function MuxNode({ id, data }: NodeProps) {
  const nodeData = (data ?? {}) as MuxNodeData

  const occupiedHandles = nodeData.occupiedHandles ?? []
  const wireMode = nodeData.wireMode ?? false
  const selectWidth = nodeData.selectWidth ?? 1
  const selectPosition = nodeData.selectPosition ?? 'bottom'
  const rotation = nodeData.rotation ?? 0
  const scale = nodeData.scale ?? 1

  const style = getSymbolStyle(nodeData)
  const geometry = getMuxGeometry(selectWidth, selectPosition, scale)
  const updateNodeInternals = useUpdateNodeInternals()

  useEffect(() => {
    updateNodeInternals(id)
  }, [
    id,
    selectWidth,
    selectPosition,
    scale,
    geometry.width,
    geometry.height,
    updateNodeInternals,
  ])

  const isOccupied = (handleId: string) => occupiedHandles.includes(handleId)
  const shouldShowCircle = (handleId: string) => !wireMode && !isOccupied(handleId)

  const bodySlant =
    selectWidth === 1 ? 18 * scale :
    selectWidth === 2 ? 24 * scale :
    selectWidth === 3 ? 30 * scale :
    36 * scale

  const bodyPath = `
    M ${geometry.bodyTopLeftX} ${geometry.bodyTopY}
    L ${geometry.bodyTopRightX} ${geometry.bodyTopY + bodySlant}
    L ${geometry.bodyBottomRightX} ${geometry.bodyBottomY - bodySlant}
    L ${geometry.bodyBottomLeftX} ${geometry.bodyBottomY}
    Z
  `

  return (
    <div
      style={{
        width: `${geometry.width}px`,
        height: `${geometry.height}px`,
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: `${geometry.width}px`,
          height: `${geometry.height}px`,
          transform: `rotate(${rotation}deg)`,
          transformOrigin: `${geometry.centerX}px ${geometry.centerY}px`,
          overflow: 'visible',
        }}
      >
        {geometry.inputPins.map((pin, index) => {
          const handleId = getMuxInputHandleId(index)

          return (
            <Pin
              key={handleId}
              id={handleId}
              handleType="target"
              position={Position.Left}
              top={`${pin.y}px`}
              left={`${pin.x}px`}
              onPointerDown={() => nodeData.onPinClick?.(id, handleId, 'target')}
            />
          )
        })}

        {geometry.selectPins.map((pin, index) => {
          const handleId = getMuxSelectHandleId(index)

          return (
            <Pin
              key={handleId}
              id={handleId}
              handleType="target"
              position={selectPosition === 'bottom' ? Position.Bottom : Position.Top}
              top={`${pin.y}px`}
              left={`${pin.x}px`}
              onPointerDown={() => nodeData.onPinClick?.(id, handleId, 'target')}
            />
          )
        })}

        <Pin
          id="out"
          handleType="source"
          position={Position.Right}
          top={`${geometry.out.y}px`}
          left={`${geometry.out.x}px`}
          onPointerDown={() => nodeData.onPinClick?.(id, 'out', 'source')}
        />

        <svg
          width={geometry.width}
          height={geometry.height}
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          style={{ overflow: 'visible' }}
        >
          {geometry.inputPins.map((pin, index) => {
            const handleId = getMuxInputHandleId(index)

            const startX = isOccupied(handleId)
              ? pin.x - geometry.connectedOverlap
              : pin.x

            return (
              <g key={handleId}>
                <line
                  x1={startX}
                  y1={pin.y}
                  x2={geometry.inputStubEndX}
                  y2={pin.y}
                  stroke={style.strokeColor}
                  strokeWidth={style.strokeWidth}
                  strokeLinecap="butt"
                />

                <PinCircle
                  pin={pin}
                  showCircle={shouldShowCircle(handleId)}
                  strokeColor={style.strokeColor}
                  radius={geometry.pinCircleRadius}
                />
              </g>
            )
          })}

          {geometry.selectPins.map((pin, index) => {
            const handleId = getMuxSelectHandleId(index)

            const bodyContactY =
              geometry.selectBodyContactYs[index] ?? geometry.selectStubStartY

            const circleEdgeY =
              selectPosition === 'bottom'
                ? pin.y - geometry.pinCircleRadius
                : pin.y + geometry.pinCircleRadius

            const legEndY = isOccupied(handleId)
              ? selectPosition === 'bottom'
                ? circleEdgeY + geometry.connectedOverlap
                : circleEdgeY - geometry.connectedOverlap
              : circleEdgeY

            return (
              <g key={handleId}>
                <line
                  x1={pin.x}
                  y1={bodyContactY}
                  x2={pin.x}
                  y2={legEndY}
                  stroke={style.strokeColor}
                  strokeWidth={style.strokeWidth}
                  strokeLinecap="butt"
                />

                <PinCircle
                  pin={pin}
                  showCircle={shouldShowCircle(handleId)}
                  strokeColor={style.strokeColor}
                  radius={geometry.pinCircleRadius}
                />
              </g>
            )
          })}

          <path
            d={bodyPath}
            fill={style.fillColor}
            stroke={style.strokeColor}
            strokeWidth={style.strokeWidth}
            strokeLinejoin="miter"
          />

          <line
            x1={geometry.outputStubStartX}
            y1={geometry.out.y}
            x2={
              isOccupied('out')
                ? geometry.outputStubEndX + geometry.connectedOverlap
                : geometry.outputStubEndX
            }
            y2={geometry.out.y}
            stroke={style.strokeColor}
            strokeWidth={style.strokeWidth}
            strokeLinecap="butt"
          />

          <PinCircle
            pin={geometry.out}
            showCircle={shouldShowCircle('out')}
            strokeColor={style.strokeColor}
            radius={geometry.pinCircleRadius}
          />

          {nodeData.label && (
            <text
              x={geometry.labelX + style.labelOffsetX}
              y={geometry.labelY + style.labelOffsetY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={style.labelSize}
              fontWeight="700"
              fill={style.labelColor}
            >
              {nodeData.label}
            </text>
          )}

          {nodeData.showSelectEncoding &&
            geometry.inputPins.flatMap((pin, inputIndex) => {
              const gray = toGrayCode(inputIndex)
              const label = formatBinary(gray, selectWidth)

              return label.split('').map((bit, bitIndex) => {
                const selectPin = geometry.selectPins[bitIndex]
                if (!selectPin) return null

                return (
                  <text
                    key={`mux-gray-${inputIndex}-${bitIndex}`}
                    x={selectPin.x}
                    y={pin.y}
                    textAnchor="middle"
                    fontSize={12}
                    fill="#888"
                    dominantBaseline="middle"
                  >
                    {bit}
                  </text>
                )
              })
            })}
        </svg>
      </div>
    </div>
  )
}