import { Position, type NodeProps } from '@xyflow/react'
import Pin from '../../common/Pin'
import type { SymbolNodeData } from '../../types'
import {
  ADDER_GEOMETRY,
  getAdderGeometry,
  getAdderPinAnchor,
  type AdderGeometry,
} from './AdderGeometry'

export { ADDER_GEOMETRY, getAdderGeometry, getAdderPinAnchor }
export type { AdderGeometry }

export type AdderNodeData = SymbolNodeData & {
    rotation?: 0 | 90 | 180 | 270
}

function InputPinVisual({
  x,
  y,
  geometry,
  occupied,
  showCircle,
}: {
  x: number
  y: number
  geometry: AdderGeometry
  occupied: boolean
  showCircle: boolean
}) {
  const startX = occupied ? x - geometry.connectedOverlap : x

  return (
    <>
      <line
        x1={startX}
        y1={y}
        x2={geometry.inputStubEndX}
        y2={y}
        stroke="#111"
        strokeWidth="2"
        strokeLinecap="square"
      />
      {showCircle && <circle cx={x} cy={y} r={geometry.pinCircleRadius} fill="#111" />}
    </>
  )
}

function OutputPinVisual({
  geometry,
  occupied,
  showCircle,
}: {
  geometry: AdderGeometry
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

export function AdderNode({ id, data }: NodeProps) {
  const nodeData = (data ?? {}) as AdderNodeData
  const occupiedHandles = nodeData.occupiedHandles ?? []
  const wireMode = nodeData.wireMode ?? false
  const rotation = nodeData.rotation ?? 0

  const geometry = getAdderGeometry()

  const isOccupied = (handleId: string) => occupiedHandles.includes(handleId)
  const shouldShowCircle = (handleId: string) =>
    !wireMode && !isOccupied(handleId)

  const bodyPath = `
    M ${geometry.bodyLeftX} ${geometry.bodyTopY}
    L ${geometry.bodyRightX} ${geometry.bodyMidY - 10}
    L ${geometry.bodyRightX} ${geometry.bodyMidY + 10}
    L ${geometry.bodyLeftX} ${geometry.bodyBottomY}
    L ${geometry.bodyLeftX} ${geometry.notchMidY + geometry.notchHalfHeight}
    L ${geometry.notchTipX} ${geometry.notchMidY}
    L ${geometry.bodyLeftX} ${geometry.notchMidY - geometry.notchHalfHeight}
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
        <Pin
          id="inA"
          handleType="target"
          position={Position.Left}
          top={`${geometry.inA.y}px`}
          left={`${geometry.inA.x}px`}
          onPointerDown={() => {
            nodeData.onPinClick?.(id, 'inA', 'target')
          }}
        />

        <Pin
          id="inB"
          handleType="target"
          position={Position.Left}
          top={`${geometry.inB.y}px`}
          left={`${geometry.inB.x}px`}
          onPointerDown={() => {
            nodeData.onPinClick?.(id, 'inB', 'target')
          }}
        />

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
          <InputPinVisual
            x={geometry.inA.x}
            y={geometry.inA.y}
            geometry={geometry}
            occupied={isOccupied('inA')}
            showCircle={shouldShowCircle('inA')}
          />

          <InputPinVisual
            x={geometry.inB.x}
            y={geometry.inB.y}
            geometry={geometry}
            occupied={isOccupied('inB')}
            showCircle={shouldShowCircle('inB')}
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

          <text
            x={geometry.plusX}
            y={geometry.plusY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="22"
            fontWeight="700"
            fill="#111"
          >
            +
          </text>
        </svg>
      </div>
    </div>
  )
}