import { Position, type NodeProps } from '@xyflow/react'
import Pin from '../../common/Pin'
import type { SymbolNodeData } from '../../types'
import {
  REGISTER_GEOMETRY,
  getRegisterGeometry,
  getRegisterPinAnchor,
  type RegisterGeometry,
} from './RegisterGeometry'

export { REGISTER_GEOMETRY, getRegisterGeometry, getRegisterPinAnchor }
export type { RegisterGeometry }

export type RegisterNodeData = SymbolNodeData & {
    rotation?: 0 | 90 | 180 | 270
}

function InputPinVisual({
  x,
  y,
  x2,
  geometry,
  occupied,
  showCircle,
}: {
  x: number
  y: number
  x2: number
  geometry: RegisterGeometry
  occupied: boolean
  showCircle: boolean
}) {
  const startX = occupied ? x - geometry.connectedOverlap : x

  return (
    <>
      <line
        x1={startX}
        y1={y}
        x2={x2}
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
  geometry: RegisterGeometry
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
        y1={geometry.qOut.y}
        x2={endX}
        y2={geometry.qOut.y}
        stroke="#111"
        strokeWidth="2"
        strokeLinecap="square"
      />
      {showCircle && (
        <circle
          cx={geometry.qOut.x}
          cy={geometry.qOut.y}
          r={geometry.pinCircleRadius}
          fill="#111"
        />
      )}
    </>
  )
}

function BottomPinVisual({
  geometry,
  occupied,
  showCircle,
}: {
  geometry: RegisterGeometry
  occupied: boolean
  showCircle: boolean
}) {
  const endY = occupied
    ? geometry.bottomStubEndY + geometry.connectedOverlap
    : geometry.bottomStubEndY

  return (
    <>
      <line
        x1={geometry.bottomPin.x}
        y1={geometry.bottomStubStartY}
        x2={geometry.bottomPin.x}
        y2={endY}
        stroke="#111"
        strokeWidth="2"
        strokeLinecap="square"
      />
      {showCircle && (
        <circle
          cx={geometry.bottomPin.x}
          cy={geometry.bottomPin.y}
          r={geometry.pinCircleRadius}
          fill="#111"
        />
      )}
    </>
  )
}

export function RegisterNode({ id, data }: NodeProps) {
  const nodeData = (data ?? {}) as RegisterNodeData
  const occupiedHandles = nodeData.occupiedHandles ?? []
  const wireMode = nodeData.wireMode ?? false
  const rotation = nodeData.rotation ?? 0

  const geometry = getRegisterGeometry()

  const isOccupied = (handleId: string) => occupiedHandles.includes(handleId)
  const shouldShowCircle = (handleId: string) =>
    !wireMode && !isOccupied(handleId)

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
          id="dIn"
          handleType="target"
          position={Position.Left}
          top={`${geometry.dIn.y}px`}
          left={`${geometry.dIn.x}px`}
          onPointerDown={() => {
            nodeData.onPinClick?.(id, 'dIn', 'target')
          }}
        />

        <Pin
          id="clkIn"
          handleType="target"
          position={Position.Left}
          top={`${geometry.clkIn.y}px`}
          left={`${geometry.clkIn.x}px`}
          onPointerDown={() => {
            nodeData.onPinClick?.(id, 'clkIn', 'target')
          }}
        />

        <Pin
          id="qOut"
          handleType="source"
          position={Position.Right}
          top={`${geometry.qOut.y}px`}
          left={`${geometry.qOut.x}px`}
          onPointerDown={() => {
            nodeData.onPinClick?.(id, 'qOut', 'source')
          }}
        />

        <Pin
          id="bottomPin"
          handleType="source"
          position={Position.Bottom}
          top={`${geometry.bottomPin.y}px`}
          left={`${geometry.bottomPin.x}px`}
          onPointerDown={() => {
            nodeData.onPinClick?.(id, 'bottomPin', 'source')
          }}
        />

        <svg
          width={geometry.width}
          height={geometry.height}
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          style={{ overflow: 'visible' }}
        >
          <InputPinVisual
            x={geometry.dIn.x}
            y={geometry.dIn.y}
            x2={geometry.inputStubEndX}
            geometry={geometry}
            occupied={isOccupied('dIn')}
            showCircle={shouldShowCircle('dIn')}
          />

          <InputPinVisual
            x={geometry.clkIn.x}
            y={geometry.clkIn.y}
            x2={geometry.inputStubEndX}
            geometry={geometry}
            occupied={isOccupied('clkIn')}
            showCircle={shouldShowCircle('clkIn')}
          />

          <rect
            x={geometry.bodyLeftX}
            y={geometry.bodyTopY}
            width={geometry.bodyRightX - geometry.bodyLeftX}
            height={geometry.bodyBottomY - geometry.bodyTopY}
            fill="white"
            stroke="#111"
            strokeWidth="2"
          />

          <path
            d={`
              M ${geometry.clockTriX} ${geometry.clockTriY - geometry.clockTriHeight / 2}
              L ${geometry.clockTriX + geometry.clockTriWidth} ${geometry.clockTriY}
              L ${geometry.clockTriX} ${geometry.clockTriY + geometry.clockTriHeight / 2}
            `}
            fill="white"
            stroke="#111"
            strokeWidth="2"
            strokeLinejoin="miter"
          />

          <OutputPinVisual
            geometry={geometry}
            occupied={isOccupied('qOut')}
            showCircle={shouldShowCircle('qOut')}
          />

          <BottomPinVisual
            geometry={geometry}
            occupied={isOccupied('bottomPin')}
            showCircle={shouldShowCircle('bottomPin')}
          />

          <text
            x={geometry.dLabelX}
            y={geometry.dLabelY}
            textAnchor="middle"
            fontSize="14"
            fontWeight="700"
            fill="#111"
          >
            D
          </text>

          <text
            x={geometry.qLabelX}
            y={geometry.qLabelY}
            textAnchor="middle"
            fontSize="14"
            fontWeight="700"
            fill="#111"
          >
            Q
          </text>
        </svg>
      </div>
    </div>
  )
}