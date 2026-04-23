import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useViewport,
  type Edge,
  type EdgeTypes,
  type Node,
  type NodeChange,
  type OnNodesChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import LeftSidebar, {
  SIDEBAR_DRAG_MIME,
  type SidebarModuleItem,
} from '../ui/layout/LeftSidebar'
import RightSidebar from '../ui/layout/RightSidebar'
import TopToolbar from '../ui/layout/TopToolbar'
import Header, {
  type AppFileHandle,
  getSavePickerWindow,
} from '../ui/layout/Header'

import { exportDiagramTikz } from '../export/tikz/exportDiagramTikz'
import { downloadTextFile } from '../export/tikz/downloadTex'
import {
  OrthogonalEdge,
  type OrthogonalEdgeData,
  type Point,
} from '../wires/OrthogonalEdge'
import { getNodeAnchor, nodeTypes } from '../symbols/registry'
import type { SymbolNodeData } from '../symbols/types'

const GRID = 20
const HALF_GRID = GRID/2

type FlowNode = Node<SymbolNodeData>
type FlowEdge = Edge<OrthogonalEdgeData>

type DraftSourcePin = {
  kind: 'pin'
  nodeId: string
  handleId: string
  point: Point
}

type InlineInvert = {
  id: string
  point: Point
  attachedTo: {
    kind: 'pin' | 'wire'
    nodeId?: string
    handleId?: string
    edgeId?: string
  }
}

type Snapshot = {
  nodes: FlowNode[]
  edges: FlowEdge[]
  partialWires: PartialWire[]
  inlineInverts: InlineInvert[]
}

type DraftSourceJunction = {
  kind: 'junction'
  point: Point
}

type DraftSource = DraftSourcePin | DraftSourceJunction

type DraftWire = {
  source: DraftSource
  bends: Point[]
  nextOrientation: 'horizontal' | 'vertical'
}

type PartialWire = {
  id: string
  sourceNodeId: string
  sourceHandleId: string
  points: Point[]
}

const edgeTypes: EdgeTypes = {
  orthogonal: OrthogonalEdge,
}

const edgeStyle: React.CSSProperties = {
  stroke: '#111',
  strokeWidth: 2,
  strokeLinecap: 'square',
  strokeLinejoin: 'miter',
}

const selectedEdgeStyle: React.CSSProperties = {
  ...edgeStyle,
  stroke: '#2563eb',
  strokeWidth: 3,
}

const initialNodes: FlowNode[] = []

function snap(value: number) {
  return Math.round(value / HALF_GRID) * HALF_GRID
}

function isDuplicatePoint(a: Point, b: Point) {
  return a.x === b.x && a.y === b.y
}

function cloneSnapshot(
  nodes: FlowNode[],
  edges: FlowEdge[],
  partialWires: PartialWire[],
  inlineInverts: InlineInvert[]
): Snapshot {
  return {
    nodes: structuredClone(nodes),
    edges: structuredClone(edges),
    partialWires: structuredClone(partialWires),
    inlineInverts: structuredClone(inlineInverts),
  }
}

function buildCorner(
  from: Point,
  to: Point,
  orientation: 'horizontal' | 'vertical'
): Point {
  const dx = Math.abs(to.x - from.x)
  const dy = Math.abs(to.y - from.y)

  if (dx < 2) return { x: from.x, y: to.y }
  if (dy < 2) return { x: to.x, y: from.y }

  if (orientation === 'horizontal') {
    return { x: to.x, y: from.y }
  }

  return { x: from.x, y: to.y }
}

function routeToSvgPath(points: Point[]) {
  if (points.length < 2) return ''

  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i += 1) {
    d += ` L ${points[i].x} ${points[i].y}`
  }
  return d
}

function isPinSource(source: DraftSource): source is DraftSourcePin {
  return source.kind === 'pin'
}

function FlowCanvas() {
  const [nodes, setNodes] = useNodesState<FlowNode>(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([])
  const [draft, setDraft] = useState<DraftWire | null>(null)
  const [mouseFlow, setMouseFlow] = useState<Point | null>(null)
  const [wireMode, setWireMode] = useState(false)
  const [deleteMode, setDeleteMode] = useState(false)
  const [partialWires, setPartialWires] = useState<PartialWire[]>([])
  const [pickedNodeId, setPickedNodeId] = useState<string | null>(null)
  const [inlineInverts, setInlineInverts] = useState<InlineInvert[]>([])

  const [undoStack, setUndoStack] = useState<Snapshot[]>([])
  const [redoStack, setRedoStack] = useState<Snapshot[]>([])

  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)
  const [tikzCodeText, setTikzCodeText] = useState('')

  const movementSnapshotTakenRef = useRef(false)

  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([])

  const { screenToFlowPosition, zoomIn, zoomOut } = useReactFlow()
  const viewport = useViewport()


useEffect(() => {
  function onKeyDown(event: KeyboardEvent) {
    const target = event.target as HTMLElement

    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable)
    ) {
      return
    }

    if (event.key.toLowerCase() === 'w') {
    event.preventDefault()

    if (!wireMode && selectedNodeIds.length === 1) {
        const node = nodes.find(n => n.id === selectedNodeIds[0])
        if (node) {
        const anchor = getPinAnchor(node, 'out') // default start from output

        setDraft({
            source: {
            kind: 'pin',
            nodeId: node.id,
            handleId: 'out',
            point: anchor,
            },
            bends: [],
            nextOrientation: 'horizontal',
        })
        }
    }

    handleToggleWireMode()
    }

    if (event.key.toLowerCase() === 'q') {
      clearDraftOnly()
      setWireMode(false)
      return
    }

    if (event.key.toLowerCase() === 'r') {
      event.preventDefault()

      if (event.shiftKey) {
        handleRotateSelectedCounterClockwise()
      } else {
        handleRotateSelectedClockwise()
      }
    }
  }

  window.addEventListener('keydown', onKeyDown)
  return () => window.removeEventListener('keydown', onKeyDown)
}, [selectedNodeIds, wireMode, draft, nodes, mouseFlow, partialWires, inlineInverts, edges])

  function handleZoomIn() {
    void zoomIn({ duration: 150 })
  }

  function handleZoomOut() {
    void zoomOut({ duration: 150 })
  }

  function getPinAnchor(node: FlowNode, handleId: string): Point {
    return getNodeAnchor(
      node.type,
      node.position.x,
      node.position.y,
      handleId,
      node.data
    )
  }

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function findNearbyPin(point: Point): {
  nodeId: string
  handleId: string
  point: Point
} | null {
  for (const node of nodes) {
    const inputCount =
      typeof node.data?.inputCount === 'number' ? node.data.inputCount : 2

    const handles: string[] = ['in', 'out']

    if (
      node.type === 'andGate' ||
      node.type === 'orGate' ||
      node.type === 'norGate' ||
      node.type === 'xorGate' ||
      node.type === 'nandGate'
    ) {
      handles.length = 0
      for (let i = 0; i < inputCount; i += 1) {
        handles.push(`in${i + 1}`)
      }
      handles.push('out')
    }

    for (const handleId of handles) {
      const anchor = getPinAnchor(node, handleId)
      if (distance(anchor, point) <= 18) {
        return {
          nodeId: node.id,
          handleId,
          point: anchor,
        }
      }
    }
  }

  return null
}

function nearestPointOnSegment(p: Point, a: Point, b: Point): Point {
  const dx = b.x - a.x
  const dy = b.y - a.y

  if (dx === 0 && dy === 0) return a

  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)
  const clamped = Math.max(0, Math.min(1, t))

  return {
    x: a.x + clamped * dx,
    y: a.y + clamped * dy,
  }
}

function findNearbyWirePoint(point: Point): Point | null {
  let bestPoint: Point | null = null
  let bestDistance = Infinity

  function testPolyline(points: Point[]) {
    for (let i = 0; i < points.length - 1; i += 1) {
      const nearest = nearestPointOnSegment(point, points[i], points[i + 1])
      const d = distance(point, nearest)

      if (d < bestDistance) {
        bestDistance = d
        bestPoint = nearest
      }
    }
  }

  for (const edge of edges) {
    const sourceNode = nodes.find((n) => n.id === edge.source)
    const targetNode = nodes.find((n) => n.id === edge.target)
    if (!sourceNode || !targetNode) continue

    const source =
      edge.data?.startAnchor ?? getPinAnchor(sourceNode, edge.sourceHandle ?? '')
    const target =
      edge.data?.endAnchor ?? getPinAnchor(targetNode, edge.targetHandle ?? '')
    const middle = edge.data?.points ?? []

    testPolyline([source, ...middle, target])
  }

  for (const wire of partialWires) {
    testPolyline(wire.points)
  }

  if (bestPoint !== null && bestDistance <= 18) {
    const p: Point = bestPoint
    return {
      x: snap(p.x),
      y: snap(p.y),
    }
  }

  return null
}

function findNearbyJunction(point: Point): Point | null {
    for (const p of junctionPoints) {
    if (distance(point, p) <= 18) {
        return p
        } 
    }
    return null
}

function normalizeRotation(value: number): 0 | 90 | 180 | 270 {
  const normalized = ((value % 360) + 360) % 360
  if (normalized === 90) return 90
  if (normalized === 180) return 180
  if (normalized === 270) return 270
  return 0
}

function handleRotateSelectedClockwise() {
  if (selectedNodeIds.length === 0) return

  pushHistorySnapshot(nodes, edges, partialWires, inlineInverts)

  const selectedSet = new Set(selectedNodeIds)

  setNodes((prev) =>
    prev.map((node) =>
      selectedSet.has(node.id)
        ? {
            ...node,
            data: {
              ...(node.data ?? {}),
              rotation: normalizeRotation(
                (typeof node.data?.rotation === 'number' ? node.data.rotation : 0) + 90
              ),
            },
          }
        : node
    )
  )
}

function handleRotateSelectedCounterClockwise() {
  if (selectedNodeIds.length === 0) return

  pushHistorySnapshot(nodes, edges, partialWires, inlineInverts)

  const selectedSet = new Set(selectedNodeIds)

  setNodes((prev) =>
    prev.map((node) =>
      selectedSet.has(node.id)
        ? {
            ...node,
            data: {
              ...(node.data ?? {}),
              rotation: normalizeRotation(
                (typeof node.data?.rotation === 'number' ? node.data.rotation : 0) - 90
              ),
            },
          }
        : node
    )
  )
}

function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

function handleDrop(event: React.DragEvent<HTMLDivElement>) {
  event.preventDefault()

  const raw = event.dataTransfer.getData(SIDEBAR_DRAG_MIME)
  if (!raw) return

  let item: SidebarModuleItem
  try {
    item = JSON.parse(raw) as SidebarModuleItem
  } catch {
    return
  }

  const flowPosition = screenToFlowPosition({
    x: event.clientX,
    y: event.clientY,
  })

  const snappedPosition = {
    x: snap(flowPosition.x),
    y: snap(flowPosition.y),
  }

  if (item.type === 'invertGate') {
    const nearbyPin = findNearbyPin(snappedPosition)
    if (nearbyPin) {
      pushHistorySnapshot(nodes, edges, partialWires, inlineInverts)

      setInlineInverts((prev) => [
        ...prev,
        {
          id: `ii-${crypto.randomUUID()}`,
          point: nearbyPin.point,
          attachedTo: {
            kind: 'pin',
            nodeId: nearbyPin.nodeId,
            handleId: nearbyPin.handleId,
          },
        },
      ])
      return
    }

    const nearbyWirePoint = findNearbyWirePoint(snappedPosition)
    if (nearbyWirePoint) {
      pushHistorySnapshot(nodes, edges, partialWires, inlineInverts)

      setInlineInverts((prev) => [
        ...prev,
        {
          id: `ii-${crypto.randomUUID()}`,
          point: nearbyWirePoint,
          attachedTo: {
            kind: 'wire',
          },
        },
      ])
      return
    }
  }

  const newNode: FlowNode = {
    id: `${item.type}-${crypto.randomUUID()}`,
    type: item.type,
    position: snappedPosition,
    selected: false,
    data: {
      ...(item.defaultData ?? {}),
      rotation: 0,
    } as SymbolNodeData,
  }

  pushHistorySnapshot(nodes, edges, partialWires, inlineInverts)
  setNodes((prev) => prev.concat(newNode))
}

async function handleSave(
  fileHandle: AppFileHandle,
  forceChoose = false
): Promise<AppFileHandle> {
  const data = {
    nodes,
    edges,
    partialWires,
    inlineInverts,
  }

  const json = JSON.stringify(data, null, 2)

  // Future desktop app path support:
  // if (fileHandle?.kind === 'desktop-path') {
  //   await desktopSaveToPath(fileHandle.path, json)
  //   return fileHandle
  // }

  const savePickerWindow = getSavePickerWindow()

  const canUseBrowserFileHandle =
    fileHandle?.kind === 'browser-file-handle' && !forceChoose

  if (canUseBrowserFileHandle) {
    const writable = await fileHandle.handle.createWritable()
    await writable.write(json)
    await writable.close()
    return fileHandle
  }

  if (savePickerWindow.showSaveFilePicker) {
    const handle = await savePickerWindow.showSaveFilePicker({
      suggestedName: 'circuit.json',
      types: [
        {
          description: 'JSON Files',
          accept: {
            'application/json': ['.json'],
          },
        },
      ],
    })

    const writable = await handle.createWritable()
    await writable.write(json)
    await writable.close()

    return {
      kind: 'browser-file-handle',
      handle,
    }
  }

  // Fallback for browsers without File System Access API
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = 'circuit.json'
  a.click()

  URL.revokeObjectURL(url)

  return null
}

function handleLoad(file: File) {
  const reader = new FileReader()

  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result as string)

      setNodes(data.nodes ?? [])
      setEdges(data.edges ?? [])
      setPartialWires(data.partialWires ?? [])
      setInlineInverts(data.inlineInverts ?? [])
    } catch {
      alert('Invalid file')
    }
  }

  reader.readAsText(file)
}

  function getDraftSourcePoint(currentDraft: DraftWire): Point {
        return currentDraft.source.point
    }

function getDraftRoutePoints(
    currentDraft: DraftWire,
    currentMouseFlow: Point | null
    ): Point[] {
    const sourcePoint = getDraftSourcePoint(currentDraft)
    const route: Point[] = [sourcePoint, ...currentDraft.bends]

    if (!currentMouseFlow) {
        return route.filter((point, index, arr) => {
        if (index === 0) return true
        return !isDuplicatePoint(point, arr[index - 1])
        })
    }

    const lastPoint = route[route.length - 1]
    const dx = Math.abs(currentMouseFlow.x - lastPoint.x)
    const dy = Math.abs(currentMouseFlow.y - lastPoint.y)

    const autoOrientation: 'horizontal' | 'vertical' =
        dx > dy ? 'horizontal' : 'vertical'

    const previewCorner = buildCorner(
        lastPoint,
        currentMouseFlow,
        autoOrientation
    )

    if (!isDuplicatePoint(previewCorner, lastPoint)) {
        route.push(previewCorner)
    }

    if (!isDuplicatePoint(currentMouseFlow, route[route.length - 1])) {
        route.push(currentMouseFlow)
    }

    return route.filter((point, index, arr) => {
        if (index === 0) return true
        return !isDuplicatePoint(point, arr[index - 1])
    })
  }

  function pushHistorySnapshot(
    currentNodes: FlowNode[],
    currentEdges: FlowEdge[],
    currentPartialWires: PartialWire[],
    currentInlineInverts: InlineInvert[]
    ) {
    setUndoStack((prev) => [
        ...prev,
        cloneSnapshot(
        currentNodes,
        currentEdges,
        currentPartialWires,
        currentInlineInverts
        ),
    ])
    setRedoStack([])
    }

  function clearDraftOnly() {
    setDraft(null)
    setMouseFlow(null)
  }

  function handleExportTikz() {
    downloadTextFile('diagram.tex', tikzCodeText)
    }

  function updateSelectedNodeData(patch: Partial<SymbolNodeData>) {
    if (!selectedNode) return

    setNodes((prev) =>
        prev.map((node) =>
        node.id === selectedNode.id
            ? {
                ...node,
                data: {
                ...(node.data ?? {}),
                ...patch,
                },
            }
            : node
        )
    )
    }

  const selectedNode = useMemo(() => {
    if (selectedNodeIds.length !== 1) return null
    return nodes.find((n) => n.id === selectedNodeIds[0]) ?? null
  }, [nodes, selectedNodeIds])

  const generatedTikz = useMemo(() => {
    return exportDiagramTikz({
        nodes,
        edges,
        partialWires,
        inlineInverts,
    })
  }, [nodes, edges, partialWires, inlineInverts])

  useEffect(() => {
    setTikzCodeText(generatedTikz)
  }, [generatedTikz])

  const junctionPoints = useMemo(() => {
    const points = new Map<string, Point>()

    function addPoint(p: Point) {
      points.set(`${p.x},${p.y}`, p)
    }

    for (const edge of edges) {
      const sourceNode = nodes.find((n) => n.id === edge.source)
      const targetNode = nodes.find((n) => n.id === edge.target)
      if (!sourceNode || !targetNode) continue

      const source =
        edge.data?.startAnchor ?? getPinAnchor(sourceNode, edge.sourceHandle ?? '')
      const target =
        edge.data?.endAnchor ?? getPinAnchor(targetNode, edge.targetHandle ?? '')
      const middle = edge.data?.points ?? []

      for (const p of [source, ...middle, target]) {
        addPoint(p)
      }
    }

    for (const wire of partialWires) {
      for (const p of wire.points) {
        addPoint(p)
      }
    }

    return Array.from(points.values())
  }, [edges, partialWires, nodes])

  function handleUndo() {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev

      const last = prev[prev.length - 1]

      setRedoStack((redoPrev) => [
        ...redoPrev,
        cloneSnapshot(nodes, edges, partialWires,inlineInverts),
      ])

      setNodes(last.nodes)
      setEdges(last.edges)
      setPartialWires(last.partialWires)
      setInlineInverts(last.inlineInverts)

      return prev.slice(0, -1)
    })

    clearDraftOnly()
    setWireMode(false)
    setDeleteMode(false)
    setPickedNodeId(null)
    setSelectedNodeIds([])
    setSelectedEdgeIds([])
  }

  function handleRedo() {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev

      const last = prev[prev.length - 1]

      setUndoStack((undoPrev) => [
        ...undoPrev,
        cloneSnapshot(nodes, edges, partialWires, inlineInverts),
      ])

      setNodes(last.nodes)
      setEdges(last.edges)
      setPartialWires(last.partialWires)
      setInlineInverts(last.inlineInverts)

      return prev.slice(0, -1)
    })

    clearDraftOnly()
    setWireMode(false)
    setDeleteMode(false)
    setPickedNodeId(null)
    setSelectedNodeIds([])
    setSelectedEdgeIds([])
  }

  function handleCancelWire() {
    clearDraftOnly()
    setWireMode(false)
  }

function finalizeDraftAsPartial() {
  if (!draft) return

  const committedPoints = getDraftRoutePoints(draft, mouseFlow)

  if (committedPoints.length < 2) return

  pushHistorySnapshot(nodes, edges, partialWires, inlineInverts)

  setPartialWires((prev) => [
    ...prev,
    {
      id: `p-${crypto.randomUUID()}`,
      sourceNodeId: isPinSource(draft.source) ? draft.source.nodeId : '__junction__',
      sourceHandleId: isPinSource(draft.source) ? draft.source.handleId : '__junction__',
      points: committedPoints,
    },
  ])
}

  function handleToggleWireMode() {
  if (!wireMode) {
     setPickedNodeId(null)
    setDeleteMode(false)
    setWireMode(true)
    return
  }

  finalizeDraftAsPartial()
  clearDraftOnly()
  setWireMode(false)
  }

  function handleToggleDeleteMode() {
    setDeleteMode((prev) => !prev)
    setWireMode(false)
    setPickedNodeId(null)
  }

  function finishPartialWireToPoint(targetPoint: Point) {
    if (!draft) return

    const sourcePoint = getDraftSourcePoint(draft)
    const lastPoint =
      draft.bends.length > 0 ? draft.bends[draft.bends.length - 1] : sourcePoint

    const finalPoints = [...draft.bends]
    const finalCorner = buildCorner(lastPoint, targetPoint, draft.nextOrientation)

    if (
      !isDuplicatePoint(finalCorner, lastPoint) &&
      !isDuplicatePoint(finalCorner, targetPoint)
    ) {
      finalPoints.push(finalCorner)
    }

    const fullPoints = [sourcePoint, ...finalPoints, targetPoint]
    const deduped = fullPoints.filter((p, index, arr) => {
      if (index === 0) return true
      return !isDuplicatePoint(p, arr[index - 1])
    })

    if (deduped.length >= 2) {
      pushHistorySnapshot(nodes, edges, partialWires, inlineInverts)

      setPartialWires((prev) => [
        ...prev,
        {
          id: `p-${crypto.randomUUID()}`,
          sourceNodeId: isPinSource(draft.source) ? draft.source.nodeId : '__junction__',
          sourceHandleId: isPinSource(draft.source) ? draft.source.handleId : '__junction__',
          points: deduped,
        },
      ])
    }

    clearDraftOnly()
    setWireMode(false)
  }

const startOrFinishWire = (
  nodeId: string,
  handleId: string,
  handleType: 'source' | 'target'
) => {
  if (!wireMode) return

  const node = nodes.find((n) => n.id === nodeId)
  if (!node) return

  const anchor = getPinAnchor(node, handleId)

  if (!draft) {
    setDraft({
      source: {
        kind: 'pin',
        nodeId,
        handleId,
        point: anchor,
      },
      bends: [],
      nextOrientation: 'horizontal',
    })
    return
  }

  const currentSource = draft.source

  if (
    isPinSource(currentSource) &&
    currentSource.nodeId === nodeId &&
    currentSource.handleId === handleId
  ) {
    return
  }

  const sourcePoint = getDraftSourcePoint(draft)
  const lastPoint =
    draft.bends.length > 0 ? draft.bends[draft.bends.length - 1] : sourcePoint

  const finalPoints = [...draft.bends]
  const finalCorner = buildCorner(lastPoint, anchor, draft.nextOrientation)

  if (
    !isDuplicatePoint(finalCorner, lastPoint) &&
    !isDuplicatePoint(finalCorner, anchor)
  ) {
    finalPoints.push(finalCorner)
  }

  if (isPinSource(currentSource)) {
    const pinSource = currentSource

    const startNode = nodes.find((n) => n.id === pinSource.nodeId)
    if (!startNode) return

    const startHandleType =
      pinSource.handleId === 'out' ? 'source' : 'target'

    const endHandleType = handleType

    let edgeSourceNodeId = pinSource.nodeId
    let edgeSourceHandleId = pinSource.handleId
    let edgeTargetNodeId = nodeId
    let edgeTargetHandleId = handleId

    if (startHandleType === 'target' && endHandleType === 'source') {
      edgeSourceNodeId = nodeId
      edgeSourceHandleId = handleId
      edgeTargetNodeId = pinSource.nodeId
      edgeTargetHandleId = pinSource.handleId
    }

    const alreadyExists = edges.some(
      (edge) =>
        edge.source === edgeSourceNodeId &&
        edge.sourceHandle === edgeSourceHandleId &&
        edge.target === edgeTargetNodeId &&
        edge.targetHandle === edgeTargetHandleId
    )

    if (!alreadyExists) {
      pushHistorySnapshot(nodes, edges, partialWires, inlineInverts)

      const startAnchor = getPinAnchor(
        nodes.find((n) => n.id === edgeSourceNodeId)!,
        edgeSourceHandleId
      )
      const endAnchor = getPinAnchor(
        nodes.find((n) => n.id === edgeTargetNodeId)!,
        edgeTargetHandleId
      )

      const newEdge: FlowEdge = {
        id: `e-${crypto.randomUUID()}`,
        source: edgeSourceNodeId,
        sourceHandle: edgeSourceHandleId,
        target: edgeTargetNodeId,
        targetHandle: edgeTargetHandleId,
        type: 'orthogonal',
        selected: false,
        style: edgeStyle,
        data: {
            points: finalPoints,
            startAnchor,
            endAnchor,
            stroke: '#111',
            strokeWidth: 2,
        },
      }

      setEdges((eds) => eds.concat(newEdge))
    }

    clearDraftOnly()
    setWireMode(false)
    return
  }

  finishPartialWireToPoint(anchor)
}

  function handleJunctionClick(point: Point) {
    if (!wireMode) return

    if (!draft) {
      setDraft({
        source: {
          kind: 'junction',
          point,
        },
        bends: [],
        nextOrientation: 'horizontal',
      })
      return
    }

    finishPartialWireToPoint(point)
  }

  function handleDeleteSelection() {
    if (selectedNodeIds.length === 0 && selectedEdgeIds.length === 0) return

    pushHistorySnapshot(nodes, edges, partialWires, inlineInverts)

    const nodeIdSet = new Set(selectedNodeIds)
    const edgeIdSet = new Set(selectedEdgeIds)

    setNodes((prev) => prev.filter((node) => !nodeIdSet.has(node.id)))

   setInlineInverts((prev) =>
    prev.filter((inv) => {
        if (inv.attachedTo.kind !== 'pin') return true
        return !nodeIdSet.has(inv.attachedTo.nodeId ?? '')
    })
    )

    setEdges((prev) =>
      prev.filter(
        (edge) =>
          !edgeIdSet.has(edge.id) &&
          !nodeIdSet.has(edge.source) &&
          !nodeIdSet.has(edge.target)
      )
    )

    setPartialWires((prev) =>
      prev.filter((wire) => !nodeIdSet.has(wire.sourceNodeId))
    )

    setSelectedNodeIds([])
    setSelectedEdgeIds([])
    setPickedNodeId(null)
  }

  function updateSelectedEdgeData(patch: Partial<OrthogonalEdgeData>) {
    if (!selectedEdge) return

    setEdges((prev) =>
        prev.map((edge) =>
        edge.id === selectedEdge.id
            ? {
                ...edge,
                data: {
                ...(edge.data ?? {}),
                ...patch,
                },
            }
            : edge
        )
    )
    }

  const selectedEdge = useMemo(() => {
    if (selectedEdgeIds.length !== 1) return null
    return edges.find((e) => e.id === selectedEdgeIds[0]) ?? null
    }, [edges, selectedEdgeIds])

  const displayNodes: FlowNode[] = useMemo(() => {
    const selectedSet = new Set(selectedNodeIds)

    return nodes.map((node) => {
        const occupied = new Set<string>()

        function markHandleIfTouched(handleId: string, point: Point | undefined) {
        if (!point) return
        const anchor = getPinAnchor(node, handleId)
        if (pointsTouch(anchor, point, 3)) {
            occupied.add(handleId)
        }
        }

        // Real edges
        for (const edge of edges) {
        if (edge.source === node.id && edge.sourceHandle) {
            const edgeStart =
            edge.data?.startAnchor ??
            (() => {
                const sourceNode = nodes.find((n) => n.id === edge.source)
                if (!sourceNode) return undefined
                return getPinAnchor(sourceNode, edge.sourceHandle!)
            })()

            markHandleIfTouched(edge.sourceHandle, edgeStart)
        }

        if (edge.target === node.id && edge.targetHandle) {
            const edgeEnd =
            edge.data?.endAnchor ??
            (() => {
                const targetNode = nodes.find((n) => n.id === edge.target)
                if (!targetNode) return undefined
                return getPinAnchor(targetNode, edge.targetHandle!)
            })()

            markHandleIfTouched(edge.targetHandle, edgeEnd)
        }
        }

        // Partial wires: check first and last point against this node's handles
        for (const wire of partialWires) {
        if (wire.points.length === 0) continue

        const firstPoint = wire.points[0]
        const lastPoint = wire.points[wire.points.length - 1]

        // standard simple gates
        markHandleIfTouched('in', firstPoint)
        markHandleIfTouched('in', lastPoint)
        markHandleIfTouched('out', firstPoint)
        markHandleIfTouched('out', lastPoint)

        // multi-input gates
        const inputCount =
            typeof node.data?.inputCount === 'number' ? node.data.inputCount : 2

        for (let i = 0; i < inputCount; i += 1) {
            markHandleIfTouched(`in${i + 1}`, firstPoint)
            markHandleIfTouched(`in${i + 1}`, lastPoint)
        }

        // register / adder style handles
        markHandleIfTouched('inA', firstPoint)
        markHandleIfTouched('inA', lastPoint)
        markHandleIfTouched('inB', firstPoint)
        markHandleIfTouched('inB', lastPoint)
        markHandleIfTouched('dIn', firstPoint)
        markHandleIfTouched('dIn', lastPoint)
        markHandleIfTouched('clkIn', firstPoint)
        markHandleIfTouched('clkIn', lastPoint)
        markHandleIfTouched('qOut', firstPoint)
        markHandleIfTouched('qOut', lastPoint)
        markHandleIfTouched('bottomPin', firstPoint)
        markHandleIfTouched('bottomPin', lastPoint)
        }

        // current draft
        if (draft && isPinSource(draft.source) && draft.source.nodeId === node.id) {
        const currentAnchor = getPinAnchor(node, draft.source.handleId)
        if (pointsTouch(currentAnchor, draft.source.point, 3)) {
            occupied.add(draft.source.handleId)
        }
        }

        return {
        ...node,
        selected: selectedSet.has(node.id),
        style: selectedSet.has(node.id)
            ? {
                boxShadow: '0 0 0 2px #2563eb',
                borderRadius: 8,
            }
            : undefined,
        data: {
            ...(node.data ?? {}),
            occupiedHandles: Array.from(occupied),
            wireMode,
            onPinClick: startOrFinishWire,
        },
        }
    })
    }, [nodes, edges, partialWires, draft, wireMode, selectedNodeIds])

  const displayEdges: FlowEdge[] = useMemo(() => {
    const selectedSet = new Set(selectedEdgeIds)

    return edges.map((edge) => ({
      ...edge,
      selected: selectedSet.has(edge.id),
      style: selectedSet.has(edge.id) ? selectedEdgeStyle : edgeStyle,
    }))
  }, [edges, selectedEdgeIds])

function handleNodeClick(event: React.MouseEvent, node: FlowNode) {
  if (wireMode || draft) return

  event.stopPropagation()

  if (deleteMode) {
  pushHistorySnapshot(nodes, edges, partialWires, inlineInverts)

  setNodes((prev) => prev.filter((n) => n.id !== node.id))
  setEdges((prev) =>
    prev.filter((edge) => edge.source !== node.id && edge.target !== node.id)
  )
  setPartialWires((prev) =>
    prev.filter((wire) => wire.sourceNodeId !== node.id)
  )

  setInlineInverts((prev) =>
    prev.filter((inv) => {
      if (inv.attachedTo.kind !== 'pin') return true
      return inv.attachedTo.nodeId !== node.id
    })
  )

  setSelectedNodeIds((prev) => prev.filter((id) => id !== node.id))
  setPickedNodeId(null)
  return
}

  // Shift + click = toggle selection for delete
  if (event.shiftKey) {
    setSelectedNodeIds((prev) =>
      prev.includes(node.id)
        ? prev.filter((id) => id !== node.id)
        : [...prev, node.id]
    )

    // Do not start moving when shift-selecting
    setPickedNodeId(null)
    return
  }

  // Regular click = move mode
  setPickedNodeId((current) => (current === node.id ? null : node.id))

  // Optional: clear delete-selection on normal click
  setSelectedNodeIds([])
  setSelectedEdgeIds([])
}

function pointsTouch(a: Point, b: Point, tolerance = 1) {
  return Math.abs(a.x - b.x) <= tolerance && Math.abs(a.y - b.y) <= tolerance
}

 function handleEdgeClick(event: React.MouseEvent, edge: FlowEdge) {
  if (wireMode || draft) return

  event.stopPropagation()

  if (deleteMode) {
    pushHistorySnapshot(nodes, edges, partialWires, inlineInverts)
    setEdges((prev) => prev.filter((e) => e.id !== edge.id))
    setSelectedEdgeIds((prev) => prev.filter((id) => id !== edge.id))
    return
  }

  if (event.shiftKey) {
    setSelectedEdgeIds((prev) =>
      prev.includes(edge.id)
        ? prev.filter((id) => id !== edge.id)
        : [...prev, edge.id]
    )

    setPickedNodeId(null)
    return
  }

  // Regular click on edge just clears move-pick and selects only this edge if you want
  setPickedNodeId(null)
  setSelectedNodeIds([])
  setSelectedEdgeIds([edge.id])
}

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (event) => {
    const pos = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    })

    const snapped = {
      x: snap(pos.x),
      y: snap(pos.y),
    }

    if (draft) {
      setMouseFlow(snapped)
      return
    }

    if (!pickedNodeId || wireMode || deleteMode) return

    setNodes((nds) =>
      nds.map((node) =>
        node.id === pickedNodeId
          ? {
              ...node,
              position: snapped,
            }
          : node
      )
    )
  }

  const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = (event) => {
    if (event.touches.length === 2 && wireMode) {
      event.preventDefault()
      clearDraftOnly()
      setWireMode(false)
    }
  }

const handlePaneClick = (event: React.MouseEvent | MouseEvent) => {
  if (pickedNodeId && !wireMode && !draft) {
    setPickedNodeId(null)
  }

  if (!wireMode && !draft) {
    // optional: clear delete selection on empty click
    setSelectedNodeIds([])
    setSelectedEdgeIds([])
    return
  }

  const pos = screenToFlowPosition({
    x: event.clientX,
    y: event.clientY,
  })

  const snapped = {
    x: snap(pos.x),
    y: snap(pos.y),
  }

  if (!draft || !wireMode) return

  const sourcePoint = getDraftSourcePoint(draft)
  const start =
    draft.bends.length > 0
      ? draft.bends[draft.bends.length - 1]
      : sourcePoint

  const corner = buildCorner(start, snapped, draft.nextOrientation)

  if (isDuplicatePoint(corner, start)) return

  pushHistorySnapshot(nodes, edges, partialWires, inlineInverts)

  setDraft((current) => {
    if (!current) return current

    return {
      ...current,
      bends: [...current.bends, corner],
      nextOrientation:
        current.nextOrientation === 'horizontal' ? 'vertical' : 'horizontal',
    }
  })
}

  const onNodesChange: OnNodesChange<FlowNode> = (changes: NodeChange<FlowNode>[]) => {
    const hasPositionChange = changes.some(
      (change) =>
        change.type === 'position' ||
        change.type === 'remove' ||
        change.type === 'replace'
    )

    if (hasPositionChange && !movementSnapshotTakenRef.current) {
      pushHistorySnapshot(nodes, edges, partialWires, inlineInverts)
      movementSnapshotTakenRef.current = true
    }

    const hasPositionEnd = changes.some(
      (change) => change.type === 'position' && change.dragging === false
    )

    setNodes((nds) => applyNodeChanges(changes, nds) as FlowNode[])

    if (hasPositionEnd) {
      movementSnapshotTakenRef.current = false
    }
  }

  const previewPath = useMemo(() => {
    if (!draft || !mouseFlow) return ''

    const route = getDraftRoutePoints(draft, mouseFlow)
    return routeToSvgPath(route)
    }, [draft, mouseFlow])

  const partialPaths = useMemo(() => {
    return partialWires.map((wire) => routeToSvgPath(wire.points)).filter(Boolean)
  }, [partialWires])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#fff',
        position: 'relative',
        overflow: 'hidden',
        }}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Header
        onSave={handleSave}
        onLoad={handleLoad}
        />

      <TopToolbar
        deleteMode={deleteMode}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        canDelete={selectedNodeIds.length > 0 || selectedEdgeIds.length > 0}
        canRotate={selectedNodeIds.length > 0}
        onToggleDeleteMode={handleToggleDeleteMode}
        onDelete={handleDeleteSelection}
        onRotateClockwise={handleRotateSelectedClockwise}
        onRotateCounterClockwise={handleRotateSelectedCounterClockwise}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExportTikz={handleExportTikz}
        sidebarOpen={leftOpen}
        rightSidebarOpen={rightOpen}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        />

      <LeftSidebar
        open={leftOpen}
        setOpen={setLeftOpen}
        modules={[
          // Gates
        
          {
            type: 'andGate',
            label: 'AND',
            category: 'Logic Gates',
            defaultData: { inputCount: 2 },
          },
          {
            type: 'andGate',
            label: 'AND 3',
            category: 'Logic Gates',
            defaultData: { inputCount: 3 },
          },
          {
            type: 'andGate',
            label: 'AND 4',
            category: 'Logic Gates',
            defaultData: { inputCount: 4 },
          },
          {
            type: 'orGate',
            label: 'OR',
            category: 'Logic Gates',
            defaultData: { inputCount: 2},
          },
          {
            type: 'orGate',
            label: 'OR 3',
            category: 'Logic Gates',
            defaultData: { inputCount: 3 },
          },
          {
            type: 'orGate',
            label: 'OR 4',
            category: 'Logic Gates',
            defaultData: { inputCount: 4 },
          },
          {
            type: 'norGate',
            label: 'NOR',
            category: 'Logic Gates',
            defaultData: { inputCount: 2 },
          },
          {
            type: 'norGate',
            label: 'NOR 3',
            category: 'Logic Gates',
            defaultData: { inputCount: 3 },
          },
          {
            type: 'xorGate',
            label: 'XOR',
            category: 'Logic Gates',
            defaultData: { inputCount: 2 },
          },
          {
            type: 'xorGate',
            label: 'XOR 3',
            category: 'Logic Gates',
            defaultData: { inputCount: 3 },
          },
          {
            type: 'xorGate',
            label: 'XOR 4',
            category: 'Logic Gates',
            defaultData: { inputCount: 4 },
          },
          {
            type: 'nandGate',
            label: 'NAND',
            category: 'Logic Gates',
            defaultData: { inputCount: 2 },
          },
          {
            type: 'nandGate',
            label: 'NAND 3',
            category: 'Logic Gates',
            defaultData: { inputCount: 3 },
          },
          {
            type: 'nandGate',
            label: 'NAND 4',
            category: 'Logic Gates',
            defaultData: { inputCount: 4 },
          },
          {
            type: 'bufferGate',
            label: 'BUFFER',
            category: 'Logic Gates',
            defaultData: {},
          },
          {
            type: 'invertGate',
            label: 'INVERT',
            category: 'Logic Gates',
            defaultData: {},
          },

            // Blocks

          {
            type: 'adderGate',
            label: 'ADDER',
            category: 'Arithmetic',
            defaultData: {},
          },
          {
            type: 'registerGate',
            label: 'REGISTER',
            category: 'Storage',
            defaultData: {},
          },
        ]}
      />

      <RightSidebar
        open={rightOpen}
        setOpen={setRightOpen}
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        codeValue={tikzCodeText}
        onCodeChange={setTikzCodeText}
        onResetCode={() => setTikzCodeText(generatedTikz)}
        onUpdateSelectedNodeData={updateSelectedNodeData}
        onUpdateSelectedEdgeData={updateSelectedEdgeData}
        />

      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onPaneClick={handlePaneClick}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        snapToGrid
        snapGrid={[HALF_GRID, HALF_GRID]}
        nodesDraggable={false}
        elementsSelectable={!draft}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Background gap={20} size={1.5} color="#bbb" />
        <Controls />
      </ReactFlow>

      <svg
        width="100%"
        height="100%"
        style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            display: 'block',
            overflow: 'hidden',
        }}
        >
        <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
            {partialPaths.map((d, index) => (
                <path
                key={`partial-${index}`}
                d={d}
                fill="none"
                stroke="#111"
                strokeWidth={2}
                strokeLinecap="square"
                strokeLinejoin="miter"
                />
            ))}

            {previewPath && (
                <path
                d={previewPath}
                fill="none"
                stroke="#111"
                strokeWidth={2}
                strokeLinecap="square"
                strokeLinejoin="miter"
                />
            )}

            {inlineInverts.map((inv) => {
                let point = inv.point

                if (inv.attachedTo.kind === 'pin') {
                    if (!inv.attachedTo.nodeId || !inv.attachedTo.handleId) {
                    return null
                    }

                    const node = nodes.find((n) => n.id === inv.attachedTo.nodeId)

                    // if the attached node is gone, do not render the bubble
                    if (!node) {
                    return null
                    }

                    point = getPinAnchor(node, inv.attachedTo.handleId)
                }

                return (
                    <circle
                    key={inv.id}
                    cx={point.x}
                    cy={point.y}
                    r={4}
                    fill="white"
                    stroke="#111"
                    strokeWidth={2}
                    />
                )
                })}
        </g>
      </svg>

      <div
        style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
        }}
        >
        {junctionPoints.map((p, index) => {
            const left = viewport.x + p.x * viewport.zoom
            const top = viewport.y + p.y * viewport.zoom

            return (
            <div
                key={`junction-hit-${index}`}
                style={{
                position: 'absolute',
                left,
                top,
                width: 18,
                height: 18,
                transform: 'translate(-50%, -50%)',
                pointerEvents: wireMode ? 'auto' : 'none',
                cursor: 'crosshair',
                background: 'transparent',
                }}
                onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleJunctionClick(p)
                }}
            >
                <div
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 5,
                    height: 5,
                    transform: 'translate(-50%, -50%)',
                    borderRadius: '50%',
                    background: '#111',
                    pointerEvents: 'none',
                    opacity: wireMode ? 0.9 : 0,
                    transition: 'opacity 0.12s ease',
                }}
                />
            </div>
            )
        })}
        </div>
    </div>
  )
}

export default function CircuitCanvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  )
}