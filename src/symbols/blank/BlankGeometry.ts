export const RECTANGLE_DEFAULT_WIDTH = 120
export const RECTANGLE_DEFAULT_HEIGHT = 80

export const CIRCLE_DEFAULT_SIZE = 90

export function getNodeWidth(data: any, fallback: number) {
  return typeof data.width === 'number' ? data.width : fallback
}

export function getNodeHeight(data: any, fallback: number) {
  return typeof data.height === 'number' ? data.height : fallback
}