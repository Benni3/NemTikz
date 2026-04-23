import type { Point } from '../../../wires/OrthogonalEdge'
import { getGeometryBounds } from '../../common/geometryBounds'
import {
  SMALL_GATE_TOP_Y,
  SYMBOL_CENTER_Y,
  SYMBOL_GRID,
} from '../../common/layout'

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

export function getAdderGeometry(): AdderGeometry {
    const HALF_GRID = SYMBOL_GRID / 2

    const bodyTopY = 20
    const bodyBottomY = 100
    const bodyMidY = 60


    const bodyLeftX = 20
    const bodyRightX = 80

    const inputStubEndX = bodyLeftX
    const outputStubStartX = bodyRightX
    const outputStubEndX = outputStubStartX + 20

    // pins on grid / half-grid
    const inA: PinPoint = { x: 0, y: 40 }
    const inB: PinPoint = { x: 0, y: 80 }
    const out: PinPoint = { x: outputStubEndX, y: 60 }

    // notch tuned to look cleaner
    const notchInsetX = 15
    const notchTipX = bodyLeftX + notchInsetX
    const notchMidY = 60
    const notchHalfHeight = 10

    const plusX = 50
    const plusY = 60

    const maxBodyX = Math.max(bodyRightX, outputStubEndX)
    const maxBodyY = Math.max(bodyBottomY, inA.y, inB.y, out.y)

    const { width, height } = getGeometryBounds({
        maxX: maxBodyX,
        maxY: maxBodyY,
        paddingX: 12,
        paddingY: 12,
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

    pinCircleRadius: 3.5,
    connectedOverlap: 2,
    
    centerX: width / 2,
    centerY: height / 2,
  }
}

export const ADDER_GEOMETRY = getAdderGeometry()

export function getAdderPinAnchor(
  nodeX: number,
  nodeY: number,
  handleId: string
): Point {
  const geometry = getAdderGeometry()
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