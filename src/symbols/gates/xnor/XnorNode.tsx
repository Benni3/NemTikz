import { useEffect } from 'react'
import {
  Position,
  type NodeProps,
  useUpdateNodeInternals,
} from '@xyflow/react'
import Pin from '../../common/Pin'
import type { SymbolNodeData } from '../../types'
import { getSymbolStyle } from '../../common/symbolStyle'
import {
  XNOR_GEOMETRY,
  getXnorGeometry,
  getXnorInputHandleId,
  getXnorPinAnchor,
  type XnorGeometry,
  type PinPoint,
} from './XnorGeometry'

export { XNOR_GEOMETRY, getXnorGeometry, getXnorInputHandleId, getXnorPinAnchor }
export type { XnorGeometry, PinPoint }

export type XnorNodeData = SymbolNodeData & {
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
  geometry: XnorGeometry
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
  fillColor,
  strokeWidth,
}: {
  geometry: XnorGeometry
  occupied: boolean
  showCircle: boolean
  strokeColor: string
  fillColor: string
  strokeWidth: number
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
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />

      <line
        x1={geometry.outputLineStartX}
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

export function XnorNode({ id, data }: NodeProps) {
  const nodeData = (data ?? {}) as XnorNodeData

  const occupiedHandles = nodeData.occupiedHandles ?? []
  const wireMode = nodeData.wireMode ?? false
  const inputCount = nodeData.inputCount ?? 2
  const rotation = nodeData.rotation ?? 0
  const scale = nodeData.scale ?? 1

  const style = getSymbolStyle(nodeData)
  const geometry = getXnorGeometry(inputCount, scale)
  const updateNodeInternals = useUpdateNodeInternals()

  useEffect(() => {
    updateNodeInternals(id)
  }, [id, inputCount, scale, geometry.width, geometry.height, updateNodeInternals])

  const isOccupied = (handleId: string) => occupiedHandles.includes(handleId)
  const shouldShowCircle = (handleId: string) => !wireMode && !isOccupied(handleId)

  const curveTightness = 6 * scale
  const backCurve = 10 * scale

  const bodyPath = `
    M ${geometry.bodyStartX} ${geometry.bodyTopY}
    C ${geometry.bodyTopControlX} ${geometry.bodyTopY}
      ${geometry.bodyFrontControlX} ${geometry.bodyMidY - curveTightness}
      ${geometry.bodyFrontX} ${geometry.bodyMidY}
    C ${geometry.bodyFrontControlX} ${geometry.bodyMidY + curveTightness}
      ${geometry.bodyBottomControlX} ${geometry.bodyBottomY}
      ${geometry.bodyStartX} ${geometry.bodyBottomY}
    C ${geometry.bodyBackControlX1} ${geometry.bodyBottomY - backCurve}
      ${geometry.bodyBackControlX2} ${geometry.bodyTopY + backCurve}
      ${geometry.bodyStartX} ${geometry.bodyTopY}
    Z
  `

  const extraBackPath = `
    M ${geometry.back2StartX} ${geometry.bodyTopY}
    C ${geometry.back2TopControlX} ${geometry.bodyTopY + backCurve}
      ${geometry.back2BottomControlX} ${geometry.bodyBottomY - backCurve}
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
        {geometry.inputPins.map((pin, index) => {
          const handleId = getXnorInputHandleId(index)

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
            const handleId = getXnorInputHandleId(index)

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
            d={extraBackPath}
            fill="none"
            stroke={style.strokeColor}
            strokeWidth={style.strokeWidth}
            strokeLinejoin="miter"
          />

          <path
            d={bodyPath}
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
            fillColor={style.fillColor}
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