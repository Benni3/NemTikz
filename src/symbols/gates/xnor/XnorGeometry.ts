import type { Point } from '../../../wires/OrthogonalEdge'
import {
  getXorGeometry,
  getXorInputHandleId,
  type XorGeometry,
  type PinPoint,
} from '../xor/XorGeometry'
import { getSymbolScale, s } from '../../common/scale'

export type { PinPoint }

export type XnorGeometry = XorGeometry & {
  bubbleRadius: number
  bubbleCenterX: number
  bubbleCenterY: number
  outputLineStartX: number
  outputLineEndX: number
  totalWidth: number
}

const DEFAULT_INPUT_COUNT = 2

export function getXnorInputHandleId(index: number) {
  return getXorInputHandleId(index)
}

export function getXnorGeometry(
  inputCount = DEFAULT_INPUT_COUNT,
  rawScale: unknown = 1
): XnorGeometry {
  const scale = getSymbolScale(rawScale)
  const xorGeometry = getXorGeometry(inputCount, scale)

  const bubbleRadius = Math.max(4, 4 * Math.sqrt(scale))
  const bubbleCenterX = xorGeometry.bodyFrontX + bubbleRadius + s(1, scale)
  const bubbleCenterY = xorGeometry.bodyMidY

  const outputLineStartX = bubbleCenterX + bubbleRadius
  const outputLineEndX = outputLineStartX + s(14, scale)
  const totalWidth = outputLineEndX + s(8, scale)

  return {
    ...xorGeometry,
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

export const XNOR_GEOMETRY = getXnorGeometry(DEFAULT_INPUT_COUNT, 1)

export function getXnorPinAnchor(
  nodeX: number,
  nodeY: number,
  handleId: string,
  inputCount = DEFAULT_INPUT_COUNT,
  rawScale: unknown = 1
): Point {
  const geometry = getXnorGeometry(inputCount, rawScale)
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