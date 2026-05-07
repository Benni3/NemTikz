import { useEffect } from 'react'
import { Position, type NodeProps, useUpdateNodeInternals } from '@xyflow/react'
import Pin from '../../common/Pin'
import type { SymbolNodeData } from '../../types'
import {
  getAndGeometry,
  getAndInputHandleId,
  type AndGeometry,
  type PinPoint,
} from './AndGeometry'
import { getSymbolStyle } from '../../common/symbolStyle'

export {
  AND_GEOMETRY,
  getAndGeometry,
  getAndInputHandleId,
  getAndPinAnchor,
  type AndGeometry,
  type PinPoint,
} from './AndGeometry'

export type AndNodeData = SymbolNodeData & {
  inputCount?: number
  scale?: number
  rotation?: 0 | 90 | 180 | 270
}

function InputPinVisual({
  geometry,
  pin,
  occupied,
  showCircle,
  strokeColor,
  strokeWidth,
}: {
  geometry: AndGeometry
  pin: PinPoint
  occupied: boolean
  showCircle: boolean
  strokeColor: string
  strokeWidth: number
}) {
  const startX = occupied ? pin.x - geometry.connectedOverlap : pin.x

  return (
    <>
      <line
        x1={startX}
        y1={pin.y}
        x2={geometry.inputStubEndX}
        y2={pin.y}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="square"
      />

      {showCircle && (
        <circle
          cx={pin.x}
          cy={pin.y}
          r={geometry.pinCircleRadius}
          fill={strokeColor}
        />
      )}
    </>
  )
}

function OutputPinVisual({
  geometry,
  occupied,
  showCircle,
  strokeColor,
  strokeWidth,
}: {
  geometry: AndGeometry
  occupied: boolean
  showCircle: boolean
  strokeColor: string
  strokeWidth: number
}) {
  const endX = occupied
    ? geometry.outputStubEndX + geometry.connectedOverlap
    : geometry.outputStubEndX

  return (
    <>
      <line
        x1={geometry.outputStubStartX}
        y1={geometry.out.y}
        x2={endX}
        y2={geometry.out.y}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="square"
      />

      {showCircle && (
        <circle
          cx={geometry.out.x}
          cy={geometry.out.y}
          r={geometry.pinCircleRadius}
          fill={strokeColor}
        />
      )}
    </>
  )
}

export function AndNode({ id, data }: NodeProps) {
  const nodeData = (data ?? {}) as AndNodeData

  const occupiedHandles = nodeData.occupiedHandles ?? []
  const wireMode = nodeData.wireMode ?? false
  const inputCount = nodeData.inputCount ?? 2
  const rotation = nodeData.rotation ?? 0

  const scale = nodeData.scale ?? 1
  const geometry = getAndGeometry(inputCount, scale)

  const style = getSymbolStyle(nodeData)
  const updateNodeInternals = useUpdateNodeInternals()

  useEffect(() => {
    updateNodeInternals(id)
  }, [id, inputCount, scale, geometry.width, geometry.height, updateNodeInternals])

  const isOccupied = (handleId: string) => occupiedHandles.includes(handleId)
  const shouldShowCircle = (handleId: string) => !wireMode && !isOccupied(handleId)

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
          const handleId = getAndInputHandleId(index)

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
            const handleId = getAndInputHandleId(index)

            return (
              <InputPinVisual
                key={handleId}
                geometry={geometry}
                pin={pin}
                occupied={isOccupied(handleId)}
                showCircle={shouldShowCircle(handleId)}
                strokeColor={style.strokeColor}
                strokeWidth={style.strokeWidth}
              />
            )
          })}

          <path
            d={`
              M ${geometry.bodyLeftX} ${geometry.bodyTopY}
              L ${geometry.bodyLeftX} ${geometry.bodyBottomY}
              L ${geometry.bodyRightStartX} ${geometry.bodyBottomY}
              A ${geometry.bodyRadius} ${geometry.bodyRadius} 0 0 0 ${geometry.bodyRightStartX} ${geometry.bodyTopY}
              Z
            `}
            fill={style.fillColor}
            stroke={style.strokeColor}
            strokeWidth={style.strokeWidth}
            strokeLinejoin="miter"
          />

          <OutputPinVisual
            geometry={geometry}
            occupied={isOccupied('out')}
            showCircle={shouldShowCircle('out')}
            strokeColor={style.strokeColor}
            strokeWidth={style.strokeWidth}
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
        </svg>
      </div>
    </div>
  )
}