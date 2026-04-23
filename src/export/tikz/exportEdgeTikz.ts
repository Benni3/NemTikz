import { formatNum, toTikzPoint } from './coordinateMap'
import type { FlowEdge, FlowNode } from './types'
import { AND_GEOMETRY } from '../../symbols/gates/and/AndNode'

type Point = {
  x: number
  y: number
}

export function exportEdgeTikz(edge: FlowEdge, nodes: FlowNode[]): string {
  const sourceNode = nodes.find((n) => n.id === edge.source)
  const targetNode = nodes.find((n) => n.id === edge.target)

  if (!sourceNode || !targetNode) {
    return `% skipped edge ${edge.id}`
  }

  const source = getAnchor(sourceNode, edge.sourceHandle ?? '')
  const target = getAnchor(targetNode, edge.targetHandle ?? '')

  // ✅ Use routed points if they exist
  let route: Point[]

  if (edge.data?.points && edge.data.points.length > 0) {
    route = [source, ...edge.data.points, target]
  } else {
    // ✅ fallback: create orthogonal route
    route = buildAutoRoute(source, target)
  }

  const tikzPoints = route.map((p) => {
    const tp = toTikzPoint(p.x, p.y)
    return `(${formatNum(tp.x)}, ${formatNum(tp.y)})`
  })

  return `\\draw ${tikzPoints.join(' -- ')};`
}

function buildAutoRoute(a: Point, b: Point): Point[] {
  // simple clean L-shape (horizontal then vertical)
  const mid: Point = { x: b.x, y: a.y }
  return [a, mid, b]
}

function getAnchor(node: FlowNode, handleId: string): Point {
  const x = node.position.x
  const y = node.position.y

  if (node.type === 'andGate') {
    if (handleId === 'in1') return { x: x + AND_GEOMETRY.in1.x, y: y + AND_GEOMETRY.in1.y }
    if (handleId === 'in2') return { x: x + AND_GEOMETRY.in2.x, y: y + AND_GEOMETRY.in2.y }
    return { x: x + AND_GEOMETRY.out.x, y: y + AND_GEOMETRY.out.y }
  }

  return { x, y }
}