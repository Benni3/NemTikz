import type { Point } from '../../../wires/OrthogonalEdge'
import {
  getOrGeometry,
  getOrInputHandleId,
  type OrGeometry,
  type PinPoint,
} from '../or/OrGeometry'
import { getSymbolScale, s } from '../../common/scale'

export type { PinPoint }

export type XorGeometry = OrGeometry & {
  extraBackOffset: number
  back2StartX: number
  back2TopControlX: number
  back2BottomControlX: number
}

const DEFAULT_INPUT_COUNT = 2

export function getXorInputHandleId(index: number) {
  return getOrInputHandleId(index)
}

export function getXorGeometry(
  inputCount = DEFAULT_INPUT_COUNT,
  rawScale: unknown = 1
): XorGeometry {
  const scale = getSymbolScale(rawScale)
  const orGeometry = getOrGeometry(inputCount, scale)
  const offset = s(8, scale)

  return {
    ...orGeometry,
    extraBackOffset: offset,
    back2StartX: orGeometry.bodyStartX - offset,
    back2TopControlX: orGeometry.bodyBackControlX2 - offset,
    back2BottomControlX: orGeometry.bodyBackControlX1 - offset,
  }
}

export const XOR_GEOMETRY = getXorGeometry(DEFAULT_INPUT_COUNT, 1)

export function getXorPinAnchor(
  nodeX: number,
  nodeY: number,
  handleId: string,
  inputCount = DEFAULT_INPUT_COUNT,
  rawScale: unknown = 1
): Point {
  const geometry = getXorGeometry(inputCount, rawScale)
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