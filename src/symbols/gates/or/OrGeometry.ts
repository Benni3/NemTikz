import type { Point } from '../../../wires/OrthogonalEdge'
import { getGeometryBounds } from '../../common/geometryBounds'

export type PinPoint = {
  x: number
  y: number
}

import {
  SYMBOL_CENTER_Y,
  SYMBOL_PIN_SPACING,
} from '../../common/layout'

export type OrGeometry = {
  width: number
  height: number

  out: PinPoint
  inputPins: PinPoint[]

  inputStubEndX: number

  bodyStartX: number
  bodyBackControlX1: number
  bodyBackControlX2: number
  bodyTopControlX: number
  bodyBottomControlX: number
  bodyFrontControlX: number
  bodyFrontX: number

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

const DEFAULT_INPUT_COUNT = 2

export function getOrInputHandleId(index: number) {
  return `in${index + 1}`
}

export function getOrGeometry(inputCount = DEFAULT_INPUT_COUNT): OrGeometry {

const safeInputCount = Math.max(2, Math.floor(inputCount))

const inputSpacing = SYMBOL_PIN_SPACING
const bodyMidY = SYMBOL_CENTER_Y

const inputPins: PinPoint[] = Array.from({ length: safeInputCount }, (_, index) => ({
  x: 0,
  y: bodyMidY + (index - (safeInputCount - 1) / 2) * inputSpacing,
}))

const bodyTopY = inputPins[0].y - 12
const bodyBottomY = inputPins[inputPins.length - 1].y + 12

const inputStubEndX = 18

const bodyStartX = 14
const bodyBackControlX1 = 26
const bodyBackControlX2 = 26
const bodyTopControlX = 88
const bodyBottomControlX = 88
const bodyFrontX = 78 + (safeInputCount - 2) * 12
const bodyFrontControlX = bodyFrontX - 6

const outputStubStartX = bodyFrontX
const outputStubEndX = outputStubStartX + 18

const maxBodyX = Math.max(
  bodyStartX,
  bodyBackControlX1,
  bodyBackControlX2,
  bodyTopControlX,
  bodyBottomControlX,
  bodyFrontControlX,
  bodyFrontX,
  outputStubEndX
)

const maxBodyY = Math.max(
  bodyBottomY,
  bodyMidY,
  ...inputPins.map((pin) => pin.y)
)

const { width, height } = getGeometryBounds({
  maxX: maxBodyX,
  maxY: maxBodyY,
  paddingX: 10,
  paddingY: 10,
})

const labelX = 55
const labelY = bodyMidY + 5

  return {
    width,
    height,

    out: { x: outputStubEndX, y: bodyMidY },
    inputPins,

    inputStubEndX,

    bodyStartX,
    bodyBackControlX1,
    bodyBackControlX2,
    bodyTopControlX,
    bodyBottomControlX,
    bodyFrontControlX,
    bodyFrontX,

    bodyTopY,
    bodyBottomY,
    bodyMidY,

    outputStubStartX,
    outputStubEndX,

    labelX,
    labelY,

    pinCircleRadius: 3.5,
    connectedOverlap: 2,

    centerX: width / 2,
    centerY: height / 2,
  }
}

export const OR_GEOMETRY = getOrGeometry(DEFAULT_INPUT_COUNT)

export function getOrPinAnchor(
  nodeX: number,
  nodeY: number,
  handleId: string,
  inputCount = DEFAULT_INPUT_COUNT
): Point {
  const geometry = getOrGeometry(inputCount)
  const overlap = geometry.connectedOverlap

  if (handleId === 'out') {
    return {
      x: nodeX + geometry.out.x - overlap,
      y: nodeY + geometry.out.y,
    }
  }

  const match = /^in(\d+)$/.exec(handleId)
  if (match) {
    const index = Number(match[1]) - 1
    const pin = geometry.inputPins[index] ?? geometry.inputPins[0]

    return {
      x: nodeX + pin.x + overlap,
      y: nodeY + pin.y,
    }
  }

  return {
    x: nodeX + geometry.out.x - overlap,
    y: nodeY + geometry.out.y,
  }
}