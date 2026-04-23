export type BoundsInput = {
  minX?: number
  minY?: number
  maxX: number
  maxY: number
  paddingX?: number
  paddingY?: number
}

export type GeometryBounds = {
  width: number
  height: number
}

export function getGeometryBounds({
  minX = 0,
  minY = 0,
  maxX,
  maxY,
  paddingX = 10,
  paddingY = 10,
}: BoundsInput): GeometryBounds {
  const width = Math.ceil(maxX - minX + paddingX)
  const height = Math.ceil(maxY - minY + paddingY)

  return {
    width,
    height,
  }
}