import { Position, type NodeProps } from '@xyflow/react'
import Pin from '../../common/Pin'
import type { SymbolNodeData } from '../../types'
import {
  NAND_GEOMETRY,
  getNandGeometry,
  getNandInputHandleId,
  getNandPinAnchor,
  type NandGeometry,
  type PinPoint,
} from './NandGeometry'

export { NAND_GEOMETRY, getNandGeometry, getNandInputHandleId, getNandPinAnchor }
export type { NandGeometry, PinPoint }

export type NandNodeData = SymbolNodeData & {
  inputCount?: number
}

function InputPinVisual({
  geometry,
  pin,
  occupied,
  showCircle,
}: {
  geometry: NandGeometry
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
  geometry: NandGeometry
  occupied: boolean
  showCircle: boolean
}) {
  const endX = occupied
    ? geometry.outputLineEndX + geometry.connectedOverlap
    : geometry.outputLineEndX

  return (
    <>
      <circle
        cx={geometry.bubbleCenterX}
        cy={geometry.bubbleCenterY}
        r={geometry.bubbleRadius}
        fill="white"
        stroke="#111"
        strokeWidth="2"
      />
      <line
        x1={geometry.outputLineStartX}
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

export function NandNode({ id, data }: NodeProps) {
  const nodeData = (data ?? {}) as NandNodeData
  const occupiedHandles = nodeData.occupiedHandles ?? []
  const wireMode = nodeData.wireMode ?? false
  const inputCount = nodeData.inputCount ?? 2
  const rotation = nodeData.rotation ?? 0

  const geometry = getNandGeometry(inputCount)

  const isOccupied = (handleId: string) => occupiedHandles.includes(handleId)
  const shouldShowCircle = (handleId: string) =>
    !wireMode && !isOccupied(handleId)

  const bodyPath = `
    M ${geometry.bodyLeftX} ${geometry.bodyTopY}
    L ${geometry.bodyLeftX} ${geometry.bodyBottomY}
    L ${geometry.bodyRightStartX} ${geometry.bodyBottomY}
    A ${geometry.bodyRadius} ${geometry.bodyRadius} 0 0 0 ${geometry.bodyRightStartX} ${geometry.bodyTopY}
    Z
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
          const handleId = getNandInputHandleId(index)

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
            const handleId = getNandInputHandleId(index)

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