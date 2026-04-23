import type { Edge, Node } from '@xyflow/react'
import type { SymbolNodeData } from '../../symbols/types'
import type { OrthogonalEdgeData, Point } from '../../wires/OrthogonalEdge'

export type FlowNode = Node<SymbolNodeData>
export type FlowEdge = Edge<OrthogonalEdgeData>

export type PartialWire = {
  id: string
  sourceNodeId: string
  sourceHandleId: string
  points: Point[]
}

export type InlineInvertExportItem = {
  id: string
  point: Point
}

export type TikzExportInput = {
  nodes: FlowNode[]
  edges: FlowEdge[]
  partialWires?: PartialWire[]
  inlineInverts?: InlineInvertExportItem[]
}