import type { Point } from '../../../wires/OrthogonalEdge'
import { getGeometryBounds } from '../../common/geometryBounds'
import { getSymbolScale, s } from '../../common/scale'

export type PinPoint = {
  x: number
  y: number
}

export type AdderGeometry = {
  width: number
  height: number

  inA: PinPoint
  inB: PinPoint
  out: PinPoint

  inputStubEndX: number
  outputStubStartX: number
  outputStubEndX: number

  bodyLeftX: number
  bodyRightX: number
  bodyTopY: number
  bodyBottomY: number
  bodyMidY: number

  notchInsetX: number
  notchTipX: number
  notchMidY: number
  notchHalfHeight: number

  plusX: number
  plusY: number

  pinCircleRadius: number
  connectedOverlap: number

  centerX: number
  centerY: number
}

export function getAdderGeometry(rawScale: unknown = 1): AdderGeometry {
  const scale = getSymbolScale(rawScale)

  const bodyTopY = s(20, scale)
  const bodyBottomY = s(100, scale)
  const bodyMidY = s(60, scale)

  const bodyLeftX = s(20, scale)
  const bodyRightX = s(80, scale)

  const inputStubEndX = bodyLeftX
  const outputStubStartX = bodyRightX
  const outputStubEndX = outputStubStartX + s(20, scale)

  const inA: PinPoint = { x: 0, y: s(40, scale) }
  const inB: PinPoint = { x: 0, y: s(80, scale) }
  const out: PinPoint = { x: outputStubEndX, y: bodyMidY }

  const notchInsetX = s(15, scale)
  const notchTipX = bodyLeftX + notchInsetX
  const notchMidY = bodyMidY
  const notchHalfHeight = s(10, scale)

  const plusX = s(50, scale)
  const plusY = bodyMidY

  const maxBodyX = Math.max(bodyRightX, outputStubEndX)
  const maxBodyY = Math.max(bodyBottomY, inA.y, inB.y, out.y)

  const { width, height } = getGeometryBounds({
    maxX: maxBodyX,
    maxY: maxBodyY,
    paddingX: s(12, scale),
    paddingY: s(12, scale),
  })

  return {
    width,
    height,

    inA,
    inB,
    out,

    inputStubEndX,
    outputStubStartX,
    outputStubEndX,

    bodyLeftX,
    bodyRightX,
    bodyTopY,
    bodyBottomY,
    bodyMidY,

    notchInsetX,
    notchTipX,
    notchMidY,
    notchHalfHeight,

    plusX,
    plusY,

    pinCircleRadius: Math.max(3.5, 3.5 * Math.sqrt(scale)),
    connectedOverlap: 2,

    centerX: width / 2,
    centerY: height / 2,
  }
}

export const ADDER_GEOMETRY = getAdderGeometry(1)

export function getAdderPinAnchor(
  nodeX: number,
  nodeY: number,
  handleId: string,
  rawScale: unknown = 1
): Point {
  const geometry = getAdderGeometry(rawScale)
  const overlap = geometry.connectedOverlap

  if (handleId === 'inA') {
    return {
      x: nodeX + geometry.inA.x + overlap,
      y: nodeY + geometry.inA.y,
    }
  }

  if (handleId === 'inB') {
    return {
      x: nodeX + geometry.inB.x + overlap,
      y: nodeY + geometry.inB.y,
    }
  }

  return {
    x: nodeX + geometry.out.x - overlap,
    y: nodeY + geometry.out.y,
  }
}