import type { Point } from '../../../wires/OrthogonalEdge'
import {
  getBufferGeometry,
  type BufferGeometry,
} from '../buffer/BufferGeometry'

export type InvertGeometry = BufferGeometry & {
  bubbleRadius: number
  bubbleCenterX: number
  bubbleCenterY: number
  outputLineStartX: number
  outputLineEndX: number
  totalWidth: number
}

export function getInvertGeometry(): InvertGeometry {
  const base = getBufferGeometry()

  const bubbleRadius = 4
  const bubbleCenterX = base.bodyRightX + bubbleRadius + 1
  const bubbleCenterY = base.bodyMidY

  const outputLineStartX = bubbleCenterX + bubbleRadius
  const outputLineEndX = outputLineStartX + 14
  const totalWidth = outputLineEndX + 8

  return {
    ...base,
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
  }
}

export const INVERT_GEOMETRY = getInvertGeometry()

export function getInvertPinAnchor(
  nodeX: number,
  nodeY: number,
  handleId: string
): Point {
  const geometry = getInvertGeometry()
  const overlap = geometry.connectedOverlap

  if (handleId === 'in') {
    return {
      x: nodeX + geometry.in.x + overlap,
      y: nodeY + geometry.in.y,
    }
  }

  return {
    x: nodeX + geometry.out.x - overlap,
    y: nodeY + geometry.out.y,
  }
}