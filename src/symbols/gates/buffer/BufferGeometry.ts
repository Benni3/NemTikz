import type { Point } from '../../../wires/OrthogonalEdge'
import { getGeometryBounds } from '../../common/geometryBounds'
import {
  SYMBOL_CENTER_Y,
  SMALL_GATE_TOP_Y,
  SMALL_GATE_BOTTOM_Y,
} from '../../common/layout'
import { getSymbolScale, s } from '../../common/scale'

export type PinPoint = {
  x: number
  y: number
}

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

export function getBufferGeometry(rawScale: unknown = 1): BufferGeometry {
  const scale = getSymbolScale(rawScale)

  const bodyTopY = s(SMALL_GATE_TOP_Y, scale)
  const bodyBottomY = s(SMALL_GATE_BOTTOM_Y, scale)
  const bodyMidY = s(SYMBOL_CENTER_Y, scale)

  const bodyLeftX = s(12, scale)
  const bodyRightX = s(58, scale)

  const inputStubEndX = bodyLeftX
  const outputStubStartX = bodyRightX
  const outputStubEndX = outputStubStartX + s(18, scale)

  const maxBodyX = Math.max(bodyLeftX, bodyRightX, outputStubEndX)
  const maxBodyY = Math.max(bodyBottomY, bodyMidY)

  const { width, height } = getGeometryBounds({
    maxX: maxBodyX,
    maxY: maxBodyY,
    paddingX: s(8, scale),
    paddingY: s(10, scale),
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

    labelX: s(42, scale),
    labelY: bodyMidY + s(5, scale),

    pinCircleRadius: Math.max(3.5, 3.5 * Math.sqrt(scale)),
    connectedOverlap: 2,

    centerX: width / 2,
    centerY: height / 2,
  }
}

export const BUFFER_GEOMETRY = getBufferGeometry(1)

export function getBufferPinAnchor(
  nodeX: number,
  nodeY: number,
  handleId: string,
  rawScale: unknown = 1
): Point {
  const geometry = getBufferGeometry(rawScale)
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