import { Position, type NodeProps } from '@xyflow/react'
import Pin from '../../common/Pin'
import type { SymbolNodeData } from '../../types'
import {
  XOR_GEOMETRY,
  getXorGeometry,
  getXorInputHandleId,
  getXorPinAnchor,
  type XorGeometry,
  type PinPoint,
} from './XorGeometry'

export { XOR_GEOMETRY, getXorGeometry, getXorInputHandleId, getXorPinAnchor }
export type { XorGeometry, PinPoint }

export type XorNodeData = SymbolNodeData & {
  inputCount?: number
  rotation?: 0 | 90 |180 |270
}

function InputPinVisual({
  geometry,
  pin,
  occupied,
  showCircle,
}: {
  geometry: XorGeometry
  pin: PinPoint
  occupied: boolean
  showCircle: boolean
}) {
  const startX = occupied ? pin.x - geometry.connectedOverlap : pin.x

  return (
    <>
      <line
        x1={startX}
        y1={pin.y}
        x2={geometry.inputStubEndX}
        y2={pin.y}
        stroke="#111"
        strokeWidth="2"
        strokeLinecap="square"
      />
      {showCircle && (
        <circle
          cx={pin.x}
          cy={pin.y}
          r={geometry.pinCircleRadius}
          fill="#111"
        />
      )}
    </>
  )
}

function OutputPinVisual({
  geometry,
  occupied,
  showCircle,
}: {
  geometry: XorGeometry
  occupied: boolean
  showCircle: boolean
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
        stroke="#111"
        strokeWidth="2"
        strokeLinecap="square"
      />
      {showCircle && (
        <circle
          cx={geometry.out.x}
          cy={geometry.out.y}
          r={geometry.pinCircleRadius}
          fill="#111"
        />
      )}
    </>
  )
}

export function XorNode({ id, data }: NodeProps) {
  const nodeData = (data ?? {}) as XorNodeData
  const occupiedHandles = nodeData.occupiedHandles ?? []
  const wireMode = nodeData.wireMode ?? false
  const inputCount = nodeData.inputCount ?? 2
  const rotation = nodeData.rotation ?? 0

  const geometry = getXorGeometry(inputCount)

  const isOccupied = (handleId: string) => occupiedHandles.includes(handleId)
  const shouldShowCircle = (handleId: string) =>
    !wireMode && !isOccupied(handleId)

  const bodyPath = `
    M ${geometry.bodyStartX} ${geometry.bodyTopY}
    C ${geometry.bodyTopControlX} ${geometry.bodyTopY}
      ${geometry.bodyFrontControlX} ${geometry.bodyMidY - 6}
      ${geometry.bodyFrontX} ${geometry.bodyMidY}
    C ${geometry.bodyFrontControlX} ${geometry.bodyMidY + 6}
      ${geometry.bodyBottomControlX} ${geometry.bodyBottomY}
      ${geometry.bodyStartX} ${geometry.bodyBottomY}
    C ${geometry.bodyBackControlX1} ${geometry.bodyBottomY - 10}
      ${geometry.bodyBackControlX2} ${geometry.bodyTopY + 10}
      ${geometry.bodyStartX} ${geometry.bodyTopY}
    Z
  `

  const extraBackPath = `
    M ${geometry.back2StartX} ${geometry.bodyTopY}
    C ${geometry.back2TopControlX} ${geometry.bodyTopY + 10}
      ${geometry.back2BottomControlX} ${geometry.bodyBottomY - 10}
      ${geometry.back2StartX} ${geometry.bodyBottomY}
  `

  return (
    <div
      style={{
        width: geometry.width,
        height: geometry.height,
        position: 'relative',
        overflow: 'visible',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `rotate(${rotation}deg)`,
          transformOrigin: `${geometry.centerX}px ${geometry.centerY}px`,
          overflow: 'visible',
        }}
      >
        {geometry.inputPins.map((pin: PinPoint, index: number) => {
          const handleId = getXorInputHandleId(index)

          return (
            <Pin
              key={handleId}
              id={handleId}
              handleType="target"
              position={Position.Left}
              top={`${pin.y}px`}
              left={`${pin.x}px`}
              onPointerDown={() => {
                nodeData.onPinClick?.(id, handleId, 'target')
              }}
            />
          )
        })}

        <Pin
          id="out"
          handleType="source"
          position={Position.Right}
          top={`${geometry.out.y}px`}
          left={`${geometry.out.x}px`}
          onPointerDown={() => {
            nodeData.onPinClick?.(id, 'out', 'source')
          }}
        />

        <svg
          width={geometry.width}
          height={geometry.height}
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          style={{ overflow: 'visible' }}
        >
          {geometry.inputPins.map((pin: PinPoint, index: number) => {
            const handleId = getXorInputHandleId(index)

            return (
              <InputPinVisual
                key={handleId}
                geometry={geometry}
                pin={pin}
                occupied={isOccupied(handleId)}
                showCircle={shouldShowCircle(handleId)}
              />
            )
          })}

          <path
            d={extraBackPath}
            fill="none"
            stroke="#111"
            strokeWidth="2"
            strokeLinejoin="miter"
          />

          <path
            d={bodyPath}
            fill="white"
            stroke="#111"
            strokeWidth="2"
            strokeLinejoin="miter"
          />

          <OutputPinVisual
            geometry={geometry}
            occupied={isOccupied('out')}
            showCircle={shouldShowCircle('out')}
          />

          {nodeData.label && (
            <text
              x={geometry.labelX}
              y={geometry.labelY}
              textAnchor="middle"
              fontSize="14"
              fill="#111"
            >
              {nodeData.label}
            </text>
          )}
        </svg>
      </div>
    </div>
  )
}