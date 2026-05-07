import type { Point } from '../../../wires/OrthogonalEdge'
import { getGeometryBounds } from '../../common/geometryBounds'
import { SYMBOL_CENTER_Y, SYMBOL_PIN_SPACING } from '../../common/layout'
import { getSymbolScale, s } from '../../common/scale'

export type PinPoint = {
  x: number
  y: number
}

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

export function getOrGeometry(
  inputCount = DEFAULT_INPUT_COUNT,
  rawScale: unknown = 1
): OrGeometry {
  const safeInputCount = Math.max(2, Math.floor(inputCount))
  const scale = getSymbolScale(rawScale)

  const inputSpacing = s(SYMBOL_PIN_SPACING, scale)
  const bodyMidY = s(SYMBOL_CENTER_Y, scale)

  const inputPins: PinPoint[] = Array.from(
    { length: safeInputCount },
    (_, index) => ({
      x: 0,
      y: bodyMidY + (index - (safeInputCount - 1) / 2) * inputSpacing,
    })
  )

  const bodyTopY = inputPins[0].y - s(12, scale)
  const bodyBottomY = inputPins[inputPins.length - 1].y + s(12, scale)

  const inputStubEndX = s(18, scale)

  const bodyStartX = s(14, scale)
  const bodyBackControlX1 = s(26, scale)
  const bodyBackControlX2 = s(26, scale)

  const bodyFrontX = s(78 + (safeInputCount - 2) * 12, scale)
  const bodyFrontControlX = bodyFrontX - s(6, scale)

  const bodyTopControlX = bodyFrontX + s(10, scale)
  const bodyBottomControlX = bodyFrontX + s(10, scale)

  const outputStubStartX = bodyFrontX
  const outputStubEndX = outputStubStartX + s(18, scale)

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
    paddingX: s(14, scale),
    paddingY: s(14, scale),
  })

  const labelX = bodyStartX + (bodyFrontX - bodyStartX) / 2
  const labelY = bodyMidY + s(5, scale)

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

    pinCircleRadius: Math.max(3.5, 3.5 * Math.sqrt(scale)),
    connectedOverlap: 2,

    centerX: width / 2,
    centerY: height / 2,
  }
}

export const OR_GEOMETRY = getOrGeometry(DEFAULT_INPUT_COUNT, 1)

export function getOrPinAnchor(
  nodeX: number,
  nodeY: number,
  handleId: string,
  inputCount = DEFAULT_INPUT_COUNT,
  rawScale: unknown = 1
): Point {
  const geometry = getOrGeometry(inputCount, rawScale)
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