import type { Point } from '../../../wires/OrthogonalEdge'
import { getGeometryBounds } from '../../common/geometryBounds'
import {
  SMALL_GATE_TOP_Y,
  SMALL_GATE_BOTTOM_Y,
  SYMBOL_CENTER_Y,
} from '../../common/layout'

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

export function getRegisterGeometry(): RegisterGeometry {
    const bodyTopY = SMALL_GATE_TOP_Y
    const bodyBottomY = SMALL_GATE_BOTTOM_Y + 40
    const bodyMidY = SYMBOL_CENTER_Y + 10

    const bodyLeftX = 20
    const bodyRightX = 80

    // all pins on full-grid or half-grid rows
    const dIn: PinPoint = { x: 0, y: bodyTopY + 20 }          // 40 if top is 20
    const qOut: PinPoint = { x: bodyRightX + 20, y: bodyTopY + 20 }
    const clkIn: PinPoint = { x: 0, y: bodyBottomY - 20 }     // 80 if bottom is 100
    const bottomPin: PinPoint = { x: 50, y: bodyBottomY + 20 } // centered and on grid

    const inputStubEndX = bodyLeftX
    const outputStubStartX = bodyRightX
    const outputStubEndX = qOut.x

    const bottomStubStartY = bodyBottomY
    const bottomStubEndY = bottomPin.y

    // clock triangle starts right at left edge, also aligned
    const clockTriX = bodyLeftX
    const clockTriY = clkIn.y
    const clockTriWidth = 10
    const clockTriHeight = 10

    const dLabelX = bodyLeftX + 15
    const dLabelY = bodyTopY + 20

    const qLabelX = bodyRightX - 15
    const qLabelY = bodyTopY + 20

    const maxBodyX = Math.max(bodyRightX, qOut.x)
    const maxBodyY = Math.max(bodyBottomY, bottomPin.y)

    const { width, height } = getGeometryBounds({
        maxX: maxBodyX,
        maxY: maxBodyY,
        paddingX: 10,
        paddingY: 10,
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

    pinCircleRadius: 3.5,
    connectedOverlap: 2,

    centerX: width / 2,
    centerY: height / 2,
  }
}

export const REGISTER_GEOMETRY = getRegisterGeometry()

export function getRegisterPinAnchor(
  nodeX: number,
  nodeY: number,
  handleId: string
): Point {
  const geometry = getRegisterGeometry()
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