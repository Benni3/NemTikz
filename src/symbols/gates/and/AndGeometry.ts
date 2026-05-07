import type { Point } from '../../../wires/OrthogonalEdge'
import { SYMBOL_CENTER_Y, SYMBOL_PIN_SPACING } from '../../common/layout'
import { getSymbolScale, s } from '../../common/scale'

export type PinPoint = {
  x: number
  y: number
}

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

  offsetX: number
  offsetY: number
}

const DEFAULT_INPUT_COUNT = 2
const GRID = 10

function snap(value: number) {
  return Math.round(value / GRID) * GRID
}

function snapUp(value: number) {
  return Math.ceil(value / GRID) * GRID
}

export function getAndInputHandleId(index: number): string {
  return `in${index + 1}`
}

export function getAndGeometry(
  inputCount = DEFAULT_INPUT_COUNT,
  rawScale: unknown = 1
): AndGeometry {
  const scale = getSymbolScale(rawScale)
  const safeInputCount = Math.max(2, Math.floor(inputCount))

  const offsetX = s(20, scale)
  const offsetY = s(20, scale)

  const bodyFlatWidth = s(30, scale)
  const inputSpacing = s(SYMBOL_PIN_SPACING, scale)

  const bodyMidY = snap(offsetY + s(SYMBOL_CENTER_Y, scale))
  const bodyLeftX = snap(offsetX + s(20, scale))
  const inputStubEndX = bodyLeftX

  const inputPins: PinPoint[] = Array.from(
    { length: safeInputCount },
    (_, index) => ({
      x: offsetX,
      y: snap(
        bodyMidY +
          (index - (safeInputCount - 1) / 2) * inputSpacing
      ),
    })
  )

  const pinPaddingY = s(10, scale)

  const bodyTopY = snap(inputPins[0].y - pinPaddingY)
  const bodyBottomY = snap(inputPins[inputPins.length - 1].y + pinPaddingY)

  const bodyRadius = snap((bodyBottomY - bodyTopY) / 2)
  const bodyRightStartX = snap(bodyLeftX + bodyFlatWidth)

  const outY = bodyMidY
  const outputStubStartX = snap(bodyRightStartX + bodyRadius)
  const outputStubEndX = snap(outputStubStartX + s(20, scale))

  const rightMost = outputStubEndX
  const bottomMost = bodyBottomY

  const width = snapUp(rightMost + offsetX)
  const height = snapUp(bottomMost + offsetY)

  const labelX = snap(bodyLeftX + bodyFlatWidth / 2 + s(10, scale))
  const labelY = snap(outY + s(6, scale))

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

    pinCircleRadius: Math.max(3.5, 3.5 * Math.sqrt(scale)),
    connectedOverlap: 2,

    centerX: snap(width / 2),
    centerY: snap(height / 2),

    offsetX,
    offsetY,
  }
}

export const AND_GEOMETRY = getAndGeometry(DEFAULT_INPUT_COUNT, 1)

export function getAndPinAnchor(
  nodeX: number,
  nodeY: number,
  handleId: string,
  inputCount = DEFAULT_INPUT_COUNT,
  rawScale: unknown = 1
): Point {
  const geometry = getAndGeometry(inputCount, rawScale)
  const overlap = geometry.connectedOverlap

  if (handleId === 'out') {
    return {
      x: snap(nodeX + geometry.out.x - overlap),
      y: snap(nodeY + geometry.out.y),
    }
  }

  const match = /^in(\d+)$/.exec(handleId)

  if (match) {
    const index = Number(match[1]) - 1
    const pin = geometry.inputPins[index] ?? geometry.inputPins[0]

    return {
      x: snap(nodeX + pin.x + overlap),
      y: snap(nodeY + pin.y),
    }
  }

  return {
    x: snap(nodeX + geometry.out.x - overlap),
    y: snap(nodeY + geometry.out.y),
  }
}