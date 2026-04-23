import { getNodeAnchor } from '../../symbols/registry'
import { formatPoint } from './coordinateMap'
import type { FlowEdge, FlowNode, PartialWire } from './types'
import type { Point } from '../../wires/OrthogonalEdge'

function buildFallbackRoute(source: Point, target: Point): Point[] {
  const corner: Point = { x: target.x, y: source.y }
  return [source, corner, target]
}

export function exportEdgeTikz(edge: FlowEdge, nodes: FlowNode[]): string {
  const sourceNode = nodes.find((n) => n.id === edge.source)
  const targetNode = nodes.find((n) => n.id === edge.target)

  if (!sourceNode || !targetNode) {
    return `% skipped edge ${edge.id}: missing node`
  }

  const source =
    edge.data?.startAnchor ??
    getNodeAnchor(
      sourceNode.type,
      sourceNode.position.x,
      sourceNode.position.y,
      edge.sourceHandle ?? '',
      sourceNode.data
    )

  const target =
    edge.data?.endAnchor ??
    getNodeAnchor(
      targetNode.type,
      targetNode.position.x,
      targetNode.position.y,
      edge.targetHandle ?? '',
      targetNode.data
    )

  const route =
    edge.data?.points && edge.data.points.length > 0
      ? [source, ...edge.data.points, target]
      : buildFallbackRoute(source, target)

  return `\\draw ${route.map(formatPoint).join(' -- ')};`
}

export function exportPartialWireTikz(wire: PartialWire): string {
  if (!wire.points || wire.points.length < 2) {
    return ''
  }

  return `\\draw ${wire.points.map(formatPoint).join(' -- ')};`
}