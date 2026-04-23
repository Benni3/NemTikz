import type { Point } from '../../../wires/OrthogonalEdge'
import {
  getOrGeometry,
  getOrInputHandleId,
  type OrGeometry,
  type PinPoint,
} from '../or/OrGeometry'

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

export function getXorGeometry(inputCount = DEFAULT_INPUT_COUNT): XorGeometry {
  const orGeometry = getOrGeometry(inputCount)
  const offset = 8

  return {
    ...orGeometry,
    extraBackOffset: offset,
    back2StartX: orGeometry.bodyStartX - offset,
    back2TopControlX: orGeometry.bodyBackControlX2 - offset,
    back2BottomControlX: orGeometry.bodyBackControlX1 - offset,
  }
}

export const XOR_GEOMETRY = getXorGeometry(DEFAULT_INPUT_COUNT)

export function getXorPinAnchor(
  nodeX: number,
  nodeY: number,
  handleId: string,
  inputCount = DEFAULT_INPUT_COUNT
): Point {
  const geometry = getXorGeometry(inputCount)
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