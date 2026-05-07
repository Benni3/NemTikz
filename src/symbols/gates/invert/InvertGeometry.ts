import type { Point } from '../../../wires/OrthogonalEdge'
import {
  getBufferGeometry,
  type BufferGeometry,
} from '../buffer/BufferGeometry'
import { getSymbolScale, s } from '../../common/scale'

export type InvertGeometry = BufferGeometry & {
  bubbleRadius: number
  bubbleCenterX: number
  bubbleCenterY: number
  outputLineStartX: number
  outputLineEndX: number
  totalWidth: number
}

export function getInvertGeometry(rawScale: unknown = 1): InvertGeometry {
  const scale = getSymbolScale(rawScale)
  const base = getBufferGeometry(scale)

  const bubbleRadius = Math.max(4, 4 * Math.sqrt(scale))
  const bubbleCenterX = base.bodyRightX + bubbleRadius + s(1, scale)
  const bubbleCenterY = base.bodyMidY

  const outputLineStartX = bubbleCenterX + bubbleRadius
  const outputLineEndX = outputLineStartX + s(14, scale)
  const totalWidth = outputLineEndX + s(8, scale)

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
    centerX: totalWidth / 2,
  }
}

export const INVERT_GEOMETRY = getInvertGeometry(1)

export function getInvertPinAnchor(
  nodeX: number,
  nodeY: number,
  handleId: string,
  rawScale: unknown = 1
): Point {
  const geometry = getInvertGeometry(rawScale)
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