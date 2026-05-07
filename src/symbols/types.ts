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
  inputCount?: number

  selectWidth?: number
  selectPosition?: 'top' | 'bottom'

  scale?: number // 1–10
  
  showSelectEncoding?: boolean

  rotation?: 0 | 90 | 180 | 270

  label?: string
  labelColor?: string
  labelSize?: number
  labelOffsetX?: number
  labelOffsetY?: number

  strokeColor?: string
  fillColor?: string
  strokeWidth?: number

  occupiedHandles?: string[]
  wireMode?: boolean

  onPinClick?: (
    nodeId: string,
    handleId: string,
    handleType: 'source' | 'target'
  ) => void
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