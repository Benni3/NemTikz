import type { Point } from '../../../wires/OrthogonalEdge'
import {
  getAndGeometry,
  getAndInputHandleId,
  type AndGeometry,
  type PinPoint,
} from '../and/AndGeometry'

export type { PinPoint }

export type NandGeometry = AndGeometry & {
  bubbleRadius: number
  bubbleCenterX: number
  bubbleCenterY: number
  outputLineStartX: number
  outputLineEndX: number
}

const DEFAULT_INPUT_COUNT = 2

export function getNandInputHandleId(index: number): string {
  return getAndInputHandleId(index)
}

export function getNandGeometry(inputCount = DEFAULT_INPUT_COUNT): NandGeometry {
  const andGeometry = getAndGeometry(inputCount)

  const bubbleRadius = 4
  const bubbleCenterX = andGeometry.outputStubStartX + bubbleRadius + 1
  const bubbleCenterY = andGeometry.out.y

  const outputLineStartX = bubbleCenterX + bubbleRadius
  const outputLineEndX = outputLineStartX + 14

  const width = Math.max(andGeometry.width, outputLineEndX + 12)

  return {
    ...andGeometry,
    width,
    out: {
      x: outputLineEndX,
      y: bubbleCenterY,
    },
    bubbleRadius,
    bubbleCenterX,
    bubbleCenterY,
    outputLineStartX,
    outputLineEndX,
  }
}

export const NAND_GEOMETRY = getNandGeometry(DEFAULT_INPUT_COUNT)

export function getNandPinAnchor(
  nodeX: number,
  nodeY: number,
  handleId: string,
  inputCount = DEFAULT_INPUT_COUNT
): Point {
  const geometry = getNandGeometry(inputCount)
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