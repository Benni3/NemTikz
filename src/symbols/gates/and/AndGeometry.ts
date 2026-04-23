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

export type AndGeometry = {
  width: number
  height: number

  in1: PinPoint
  in2: PinPoint
  out: PinPoint

  inputPins: PinPoint[]

  inputStubEndX: number
  bodyLeftX: number
  bodyRightStartX: number
  bodyRadius: number
  bodyTopY: number
  bodyBottomY: number

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

export function getAndInputHandleId(index: number): string {
  return `in${index + 1}`
}

export function getAndGeometry(inputCount = DEFAULT_INPUT_COUNT): AndGeometry {

const safeInputCount = Math.max(2, Math.floor(inputCount))

const bodyLeftX = 16
const inputStubEndX = 16
const bodyFlatWidth = 30

const inputSpacing = SYMBOL_PIN_SPACING
const bodyMidY = SYMBOL_CENTER_Y

const inputPins: PinPoint[] = Array.from({ length: safeInputCount }, (_, index) => ({
  x: 0,
  y: bodyMidY + (index - (safeInputCount - 1) / 2) * inputSpacing,
}))

const bodyTopY = inputPins[0].y - 10
const bodyBottomY = inputPins[inputPins.length - 1].y + 10

const bodyRadius = (bodyBottomY - bodyTopY) / 2
const bodyRightStartX = bodyLeftX + bodyFlatWidth

const outY = bodyMidY
const outputStubStartX = bodyRightStartX + bodyRadius
const outputStubEndX = outputStubStartX + 12

const maxBodyX = Math.max(
  bodyLeftX,
  bodyRightStartX + bodyRadius,
  outputStubEndX
)

const maxBodyY = Math.max(
  bodyBottomY,
  outY,
  ...inputPins.map((pin) => pin.y)
)

const { width, height } = getGeometryBounds({
  maxX: maxBodyX,
  maxY: maxBodyY,
  paddingX: 10,
  paddingY: 10,
})

const labelX = bodyLeftX + bodyFlatWidth / 2 + 10
const labelY = outY + 6

  return {
    width,
    height,

    in1: inputPins[0],
    in2: inputPins[1],
    out: { x: outputStubEndX, y: outY },

    inputPins,

    inputStubEndX,
    bodyLeftX,
    bodyRightStartX,
    bodyRadius,
    bodyTopY,
    bodyBottomY,

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

export const AND_GEOMETRY = getAndGeometry(DEFAULT_INPUT_COUNT)

export function getAndPinAnchor(
  nodeX: number,
  nodeY: number,
  handleId: string,
  inputCount = DEFAULT_INPUT_COUNT
): Point {
  const geometry = getAndGeometry(inputCount)
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