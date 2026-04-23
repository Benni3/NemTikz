import type { Point } from '../../../wires/OrthogonalEdge'
import { getGeometryBounds } from '../../common/geometryBounds'

export type PinPoint = {
  x: number
  y: number
}

import {
  SYMBOL_CENTER_Y,
  SMALL_GATE_TOP_Y,
  SMALL_GATE_BOTTOM_Y,
} from '../../common/layout'

export type BufferGeometry = {
  width: number
  height: number

  in: PinPoint
  out: PinPoint

  inputStubEndX: number

  bodyLeftX: number
  bodyRightX: number
  bodyTopY: number
  bodyBottomY: number
  bodyMidY: number

  outputStubStartX: number
  outputStubEndX: number

  labelX: number
  labelY: number

  pinCircleRadius: number
  connectedOverlap: number

  centerX: number
  centerY: number
}

export function getBufferGeometry(): BufferGeometry {
  
const bodyTopY = SMALL_GATE_TOP_Y
const bodyBottomY = SMALL_GATE_BOTTOM_Y
const bodyMidY = SYMBOL_CENTER_Y

const bodyLeftX = 12
const bodyRightX = 58

const inputStubEndX = bodyLeftX
const outputStubStartX = bodyRightX
const outputStubEndX = outputStubStartX + 18

const maxBodyX = Math.max(
  bodyLeftX,
  bodyRightX,
  outputStubEndX
)

const maxBodyY = Math.max(
  bodyBottomY,
  bodyMidY
)

const { width, height } = getGeometryBounds({
  maxX: maxBodyX,
  maxY: maxBodyY,
  paddingX: 8,
  paddingY: 10,
})

  return {
    width,
    height,

    in: { x: 0, y: bodyMidY },
    out: { x: outputStubEndX, y: bodyMidY },

    inputStubEndX,

    bodyLeftX,
    bodyRightX,
    bodyTopY,
    bodyBottomY,
    bodyMidY,

    outputStubStartX,
    outputStubEndX,

    labelX: 42,
    labelY: bodyMidY + 5,

    pinCircleRadius: 3.5,
    connectedOverlap: 2,

    centerX: width / 2,
    centerY: height / 2,
  }
}

export const BUFFER_GEOMETRY = getBufferGeometry()

export function getBufferPinAnchor(
  nodeX: number,
  nodeY: number,
  handleId: string
): Point {
  const geometry = getBufferGeometry()
  const overlap = geometry.connectedOverlap

  if (handleId === 'in') {
    return {
      x: nodeX + geometry.in.x + overlap,
      y: nodeY + geometry.in.y,
    }
  }

  return {
    x: nodeX + geometry.out.x - overlap,
    y: nodeY + geometry.out.y,
  }
}