import type { Point } from '../../../wires/OrthogonalEdge'
import { getGeometryBounds } from '../../common/geometryBounds'
import {
  SMALL_GATE_TOP_Y,
  SMALL_GATE_BOTTOM_Y,
  SYMBOL_CENTER_Y,
} from '../../common/layout'
import { getSymbolScale, s } from '../../common/scale'

export type PinPoint = {
  x: number
  y: number
}

export type RegisterGeometry = {
  width: number
  height: number

  dIn: PinPoint
  qOut: PinPoint
  clkIn: PinPoint
  bottomPin: PinPoint

  inputStubEndX: number
  outputStubStartX: number
  outputStubEndX: number
  bottomStubStartY: number
  bottomStubEndY: number

  bodyLeftX: number
  bodyRightX: number
  bodyTopY: number
  bodyBottomY: number
  bodyMidY: number

  clockTriX: number
  clockTriY: number
  clockTriWidth: number
  clockTriHeight: number

  dLabelX: number
  dLabelY: number
  qLabelX: number
  qLabelY: number

  pinCircleRadius: number
  connectedOverlap: number

  centerX: number
  centerY: number
}

export function getRegisterGeometry(rawScale: unknown = 1): RegisterGeometry {
  const scale = getSymbolScale(rawScale)

  const bodyTopY = s(SMALL_GATE_TOP_Y, scale)
  const bodyBottomY = s(SMALL_GATE_BOTTOM_Y + 40, scale)
  const bodyMidY = s(SYMBOL_CENTER_Y + 10, scale)

  const bodyLeftX = s(20, scale)
  const bodyRightX = s(80, scale)

  const dIn: PinPoint = { x: 0, y: bodyTopY + s(20, scale) }
  const qOut: PinPoint = { x: bodyRightX + s(20, scale), y: bodyTopY + s(20, scale) }
  const clkIn: PinPoint = { x: 0, y: bodyBottomY - s(20, scale) }
  const bottomPin: PinPoint = { x: s(50, scale), y: bodyBottomY + s(20, scale) }

  const inputStubEndX = bodyLeftX
  const outputStubStartX = bodyRightX
  const outputStubEndX = qOut.x

  const bottomStubStartY = bodyBottomY
  const bottomStubEndY = bottomPin.y

  const clockTriX = bodyLeftX
  const clockTriY = clkIn.y
  const clockTriWidth = s(10, scale)
  const clockTriHeight = s(10, scale)

  const dLabelX = bodyLeftX + s(15, scale)
  const dLabelY = bodyTopY + s(20, scale)

  const qLabelX = bodyRightX - s(15, scale)
  const qLabelY = bodyTopY + s(20, scale)

  const maxBodyX = Math.max(bodyRightX, qOut.x)
  const maxBodyY = Math.max(bodyBottomY, bottomPin.y)

  const { width, height } = getGeometryBounds({
    maxX: maxBodyX,
    maxY: maxBodyY,
    paddingX: s(10, scale),
    paddingY: s(10, scale),
  })

  return {
    width,
    height,

    dIn,
    qOut,
    clkIn,
    bottomPin,

    inputStubEndX,
    outputStubStartX,
    outputStubEndX,
    bottomStubStartY,
    bottomStubEndY,

    bodyLeftX,
    bodyRightX,
    bodyTopY,
    bodyBottomY,
    bodyMidY,

    clockTriX,
    clockTriY,
    clockTriWidth,
    clockTriHeight,

    dLabelX,
    dLabelY,
    qLabelX,
    qLabelY,

    pinCircleRadius: Math.max(3.5, 3.5 * Math.sqrt(scale)),
    connectedOverlap: 2,

    centerX: width / 2,
    centerY: height / 2,
  }
}

export const REGISTER_GEOMETRY = getRegisterGeometry(1)

export function getRegisterPinAnchor(
  nodeX: number,
  nodeY: number,
  handleId: string,
  rawScale: unknown = 1
): Point {
  const geometry = getRegisterGeometry(rawScale)
  const overlap = geometry.connectedOverlap

  if (handleId === 'dIn') {
    return {
      x: nodeX + geometry.dIn.x + overlap,
      y: nodeY + geometry.dIn.y,
    }
  }

  if (handleId === 'clkIn') {
    return {
      x: nodeX + geometry.clkIn.x + overlap,
      y: nodeY + geometry.clkIn.y,
    }
  }

  if (handleId === 'bottomPin') {
    return {
      x: nodeX + geometry.bottomPin.x,
      y: nodeY + geometry.bottomPin.y - overlap,
    }
  }

  return {
    x: nodeX + geometry.qOut.x - overlap,
    y: nodeY + geometry.qOut.y,
  }
}