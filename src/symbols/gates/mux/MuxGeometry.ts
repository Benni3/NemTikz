import type { Point } from '../../../wires/OrthogonalEdge'
import { getSymbolScale, s } from '../../common/scale'

export type PinPoint = {
  x: number
  y: number
}

export type SelectPosition = 'top' | 'bottom'

export type MuxGeometry = {
  width: number
  height: number

  inputPins: PinPoint[]
  selectPins: PinPoint[]
  out: PinPoint

  inputStubEndX: number
  outputStubStartX: number
  outputStubEndX: number

  selectStubStartY: number
  selectStubEndY: number
  selectBodyContactYs: number[]

  bodyTopLeftX: number
  bodyBottomLeftX: number
  bodyTopRightX: number
  bodyBottomRightX: number
  bodyTopY: number
  bodyBottomY: number
  bodyMidY: number

  labelX: number
  labelY: number

  pinCircleRadius: number
  connectedOverlap: number

  centerX: number
  centerY: number
}

const GRID = 10

function snap10(value: number) {
  return Math.round(value / GRID) * GRID
}

export function getMuxInputHandleId(index: number) {
  return `in${index + 1}`
}

export function getMuxSelectHandleId(index: number) {
  return `sel${index + 1}`
}

export function getMuxGeometry(
  selectWidth = 1,
  selectPosition: SelectPosition = 'bottom',
  rawScale: unknown = 1
): MuxGeometry {
  const scale = getSymbolScale(rawScale)
  const safeSelectWidth = Math.max(1, Math.min(4, Math.floor(selectWidth)))
  const inputCount = 2 ** safeSelectWidth

  const inputSpacing = s(20, scale)
  const bodyPaddingY = s(20, scale)

  const minBodyHeight = s(
    safeSelectWidth === 1 ? 100 :
    safeSelectWidth === 2 ? 150 :
    safeSelectWidth === 3 ? 210 :
    360,
    scale
  )

  const bodyWidth = s(
    safeSelectWidth === 1 ? 80 :
    safeSelectWidth === 2 ? 100 :
    safeSelectWidth === 3 ? 130 :
    160,
    scale
  )

  const slantAmount = s(
    safeSelectWidth === 1 ? 18 :
    safeSelectWidth === 2 ? 24 :
    safeSelectWidth === 3 ? 30 :
    36,
    scale
  )

  const inputLegLength = s(28, scale)
  const outputLegLength = s(30, scale)
  const selectLegLength = s(24, scale)
  const selectSpacing = s(20, scale)

  const bodyLeftX = s(80, scale)
  const bodyRightX = bodyLeftX + bodyWidth

  const bodyHeight = snap10(
    Math.max(
      minBodyHeight,
      (inputCount - 1) * inputSpacing + bodyPaddingY * 2
    )
  )

  const bodyTopY = selectPosition === 'top' ? s(70, scale) : s(30, scale)
  const bodyBottomY = snap10(bodyTopY + bodyHeight)
  const bodyMidY = snap10((bodyTopY + bodyBottomY) / 2)

  const inputSpan = (inputCount - 1) * inputSpacing
  const firstInputY = snap10(bodyMidY - inputSpan / 2)

  const inputX = bodyLeftX - inputLegLength
  const inputStubEndX = bodyLeftX

  const inputPins: PinPoint[] = Array.from({ length: inputCount }, (_, i) => ({
    x: snap10(inputX),
    y: snap10(firstInputY + i * inputSpacing),
  }))

  const outputStubStartX = bodyRightX
  const outputStubEndX = bodyRightX + outputLegLength

  const out: PinPoint = {
    x: snap10(outputStubEndX),
    y: bodyMidY,
  }

  const selectGroupWidth = (safeSelectWidth - 1) * selectSpacing
  const selectStartX = snap10(
    (bodyLeftX + bodyRightX) / 2 - selectGroupWidth / 2
  )

  const selectPinY =
    selectPosition === 'bottom'
      ? snap10(bodyBottomY + selectLegLength)
      : snap10(bodyTopY - selectLegLength)

  const selectPins: PinPoint[] = Array.from(
    { length: safeSelectWidth },
    (_, i) => ({
      x: snap10(selectStartX + i * selectSpacing),
      y: selectPinY,
    })
  )

  function getTopEdgeYAtX(x: number) {
    const t = (x - bodyLeftX) / (bodyRightX - bodyLeftX)
    return bodyTopY + t * slantAmount
  }

  function getBottomEdgeYAtX(x: number) {
    const t = (x - bodyLeftX) / (bodyRightX - bodyLeftX)
    return bodyBottomY - t * slantAmount
  }

  const selectBodyContactYs = selectPins.map((pin) =>
    snap10(
      selectPosition === 'bottom'
        ? getBottomEdgeYAtX(pin.x)
        : getTopEdgeYAtX(pin.x)
    )
  )

  const selectStubStartY = selectPosition === 'bottom' ? bodyBottomY : bodyTopY
  const selectStubEndY = selectPinY

  const minY = Math.min(bodyTopY, ...selectPins.map((pin) => pin.y))
  const maxY = Math.max(bodyBottomY, ...selectPins.map((pin) => pin.y))

  const width = snap10(bodyRightX + outputLegLength + s(30, scale))
  const height = snap10(maxY + s(30, scale))

  return {
    width,
    height,

    inputPins,
    selectPins,
    out,

    inputStubEndX,
    outputStubStartX,
    outputStubEndX,

    selectStubStartY,
    selectStubEndY,
    selectBodyContactYs,

    bodyTopLeftX: bodyLeftX,
    bodyBottomLeftX: bodyLeftX,
    bodyTopRightX: bodyRightX,
    bodyBottomRightX: bodyRightX,

    bodyTopY,
    bodyBottomY,
    bodyMidY,

    labelX: snap10((bodyLeftX + bodyRightX) / 2),
    labelY: bodyMidY,

    pinCircleRadius: Math.max(3.5, 3.5 * Math.sqrt(scale)),
    connectedOverlap: 2,

    centerX: snap10((bodyLeftX + bodyRightX) / 2),
    centerY: snap10((minY + maxY) / 2),
  }
}

export const MUX_GEOMETRY = getMuxGeometry(1, 'bottom', 1)

export function getMuxPinAnchor(
  nodeX: number,
  nodeY: number,
  handleId: string,
  selectWidth = 1,
  selectPosition: SelectPosition = 'bottom',
  rawScale: unknown = 1
): Point {
  const geometry = getMuxGeometry(selectWidth, selectPosition, rawScale)
  const overlap = geometry.connectedOverlap

  if (handleId === 'out') {
    return {
      x: nodeX + geometry.out.x - overlap,
      y: nodeY + geometry.out.y,
    }
  }

  const inputMatch = /^in(\d+)$/.exec(handleId)

  if (inputMatch) {
    const index = Number(inputMatch[1]) - 1
    const pin = geometry.inputPins[index] ?? geometry.inputPins[0]

    return {
      x: nodeX + pin.x + overlap,
      y: nodeY + pin.y,
    }
  }

  const selectMatch = /^sel(\d+)$/.exec(handleId)

  if (selectMatch) {
    const index = Number(selectMatch[1]) - 1
    const pin = geometry.selectPins[index] ?? geometry.selectPins[0]
    const r = geometry.pinCircleRadius

    return {
      x: nodeX + pin.x,
      y:
        selectPosition === 'bottom'
          ? nodeY + pin.y - r
          : nodeY + pin.y + r,
    }
  }

  return {
    x: nodeX + geometry.out.x - overlap,
    y: nodeY + geometry.out.y,
  }
}