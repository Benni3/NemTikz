import type { Point } from '../../../wires/OrthogonalEdge'
import {
  getOrGeometry,
  getOrInputHandleId,
  type OrGeometry,
  type PinPoint,
} from '../or/OrGeometry'

export type { PinPoint }

export type NorGeometry = OrGeometry & {
  bubbleRadius: number
  bubbleCenterX: number
  bubbleCenterY: number
  outputLineStartX: number
  outputLineEndX: number
  totalWidth: number
}

const DEFAULT_INPUT_COUNT = 2

export function getNorInputHandleId(index: number) {
  return getOrInputHandleId(index)
}

export function getNorGeometry(inputCount = DEFAULT_INPUT_COUNT): NorGeometry {
  const orGeometry = getOrGeometry(inputCount)

  const bubbleRadius = 4
  const bubbleCenterX = orGeometry.bodyFrontX + bubbleRadius + 1
  const bubbleCenterY = orGeometry.bodyMidY

  const outputLineStartX = bubbleCenterX + bubbleRadius
  const outputLineEndX = outputLineStartX + 14
  const totalWidth = outputLineEndX + 8

  return {
    ...orGeometry,
    out: {
      x: outputLineEndX,
      y: bubbleCenterY,
    },
    bubbleRadius,
    bubbleCenterX,
    bubbleCenterY,
    outputLineStartX,
    outputLineEndX,
    totalWidth,
    width: totalWidth,
    centerX: totalWidth / 2,
  }
}

export const NOR_GEOMETRY = getNorGeometry(DEFAULT_INPUT_COUNT)

export function getNorPinAnchor(
  nodeX: number,
  nodeY: number,
  handleId: string,
  inputCount = DEFAULT_INPUT_COUNT
): Point {
  const geometry = getNorGeometry(inputCount)
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