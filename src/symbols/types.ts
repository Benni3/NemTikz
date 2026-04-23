import type { ComponentType } from 'react'
import type { Node, NodeProps } from '@xyflow/react'
import type { Point } from '../wires/OrthogonalEdge'

export type PinKind = 'source' | 'target'

export type PinDefinition = {
  id: string
  kind: PinKind
  x: number
  y: number
}

export type SymbolNodeData = {
  label?: string
  occupiedHandles?: string[]
  wireMode?: boolean

  inputCount?: number
  outputCount?: number

  rotation?: 0 | 90 | 180 | 270

  labelColor?: string
  labelSize?: number
  labelOffsetX?: number
  labelOffsetY?: number

  onPinClick?: (
    nodeId: string,
    handleId: string,
    handleType: PinKind
  ) => void

  [key: string]: unknown
}

export type SymbolNode = Node<SymbolNodeData>

export type SymbolDefinition<TNodeData extends SymbolNodeData = SymbolNodeData> = {
  type: string
  width: number
  height: number
  pins: PinDefinition[]
  component: ComponentType<NodeProps>
  getAnchor: (nodeX: number, nodeY: number, handleId: string) => Point
  exportTikz: (node: Node<TNodeData>) => string
}