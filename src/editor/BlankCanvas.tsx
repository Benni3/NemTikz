import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type NodeTypes,
} from '@xyflow/react'

import '@xyflow/react/dist/style.css'

import {
  SIDEBAR_DRAG_MIME,
  type SidebarModuleItem,
} from '../ui/layout/LeftSidebar'

import Header from '../ui/layout/Header'
import LeftSidebar from '../ui/layout/LeftSidebar'
import RightSidebar from '../ui/layout/RightSidebar'
import TopToolbar from '../ui/layout/TopToolbar'

import { RectangleNode } from '../symbols/blank/Rectangle/RectangleNode'
import { CircleNode } from '../symbols/blank/Circle/CircleNode'

import type { WorkspaceActions } from './WorkspaceActions'

type BlankCanvasProps = {
  leftOpen: boolean
  setLeftOpen: React.Dispatch<React.SetStateAction<boolean>>
  setWorkspaceActions?: React.Dispatch<
    React.SetStateAction<WorkspaceActions>
  >
}

type BlankNodeData = {
  label?: string
  fillColor?: string
  strokeColor?: string
  strokeWidth?: number

  labelColor?: string
  labelSize?: number
  labelOffsetX?: number
  labelOffsetY?: number

  rotation?: 0 | 90 | 180 | 270

  editableStyle?: boolean
  editableLabel?: boolean
  editableInputCount?: boolean

  width?: number
  height?: number
}

type BlankNode = Node<BlankNodeData>
type BlankEdge = Edge

const blankNodeTypes: NodeTypes = {
  rectangle: RectangleNode,
  circle: CircleNode,
}

function normalizeRotation(
  value: number
): 0 | 90 | 180 | 270 {
  const normalized =
    ((value % 360) + 360) % 360

  if (normalized === 90) return 90
  if (normalized === 180) return 180
  if (normalized === 270) return 270

  return 0
}

function BlankCanvasInner({
  leftOpen,
  setLeftOpen,
  setWorkspaceActions,
}: BlankCanvasProps) {
  const [nodes, setNodes, onNodesChange] =
    useNodesState<BlankNode>([])

  const [edges, setEdges, onEdgesChange] =
    useEdgesState<BlankEdge>([])

  const [rightOpen, setRightOpen] =
    useState(true)

  const [showGrid, setShowGrid] =
    useState(false)

  const [selectedNodeIds, setSelectedNodeIds] =
    useState<string[]>([])

  const [pickedNodeId, setPickedNodeId] =
    useState<string | null>(null)

  const [resizeNodeId, setResizeNodeId] =
    useState<string | null>(null)

  const [undoStack, setUndoStack] =
    useState<BlankNode[][]>([])

  const [redoStack, setRedoStack] =
    useState<BlankNode[][]>([])

  const {
    screenToFlowPosition,
    zoomIn,
    zoomOut,
  } = useReactFlow()

  const selectedNode = useMemo(() => {
    if (selectedNodeIds.length !== 1) return null

    return (
      nodes.find(
        (node) => node.id === selectedNodeIds[0]
      ) ?? null
    )
  }, [nodes, selectedNodeIds])

  const workspaceActionsRef =
    useRef<WorkspaceActions>({})

  useEffect(() => {
    workspaceActionsRef.current = {
      undo: handleUndo,
      redo: handleRedo,
      deleteSelected,
      rotateClockwise:
        rotateSelectedClockwise,
      rotateCounterClockwise:
        rotateSelectedCounterClockwise,
      addNode: addBlankNode,
    }
  })

  useEffect(() => {
    if (!setWorkspaceActions) return

    setWorkspaceActions({
      undo: () =>
        workspaceActionsRef.current.undo?.(),

      redo: () =>
        workspaceActionsRef.current.redo?.(),

      deleteSelected: () =>
        workspaceActionsRef.current.deleteSelected?.(),

      rotateClockwise: () =>
        workspaceActionsRef.current.rotateClockwise?.(),

      rotateCounterClockwise: () =>
        workspaceActionsRef.current.rotateCounterClockwise?.(),

      addNode: (type) =>
        workspaceActionsRef.current.addNode?.(
          type
        ),
    })

    return () => setWorkspaceActions({})
  }, [setWorkspaceActions])

  function pushHistorySnapshot() {
    setUndoStack((prev) => [
      ...prev,
      structuredClone(nodes),
    ])

    setRedoStack([])
  }

  function handleUndo() {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev

      const last = prev[prev.length - 1]

      setRedoStack((redoPrev) => [
        ...redoPrev,
        structuredClone(nodes),
      ])

      setNodes(last)

      return prev.slice(0, -1)
    })
  }

  function handleRedo() {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev

      const last = prev[prev.length - 1]

      setUndoStack((undoPrev) => [
        ...undoPrev,
        structuredClone(nodes),
      ])

      setNodes(last)

      return prev.slice(0, -1)
    })
  }

  function updateSelectedNodeData(
    patch: Partial<BlankNodeData>
  ) {
    if (selectedNodeIds.length === 0) return

    pushHistorySnapshot()

    const selectedSet = new Set(
      selectedNodeIds
    )

    setNodes((prev) =>
      prev.map((node) =>
        selectedSet.has(node.id)
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

  function rotateSelectedClockwise() {
    if (selectedNodeIds.length === 0) return

    pushHistorySnapshot()

    const selectedSet = new Set(
      selectedNodeIds
    )

    setNodes((prev) =>
      prev.map((node) =>
        selectedSet.has(node.id)
          ? {
              ...node,
              data: {
                ...(node.data ?? {}),
                rotation: normalizeRotation(
                  (node.data.rotation ?? 0) + 90
                ),
              },
            }
          : node
      )
    )
  }

  function rotateSelectedCounterClockwise() {
    if (selectedNodeIds.length === 0) return

    pushHistorySnapshot()

    const selectedSet = new Set(
      selectedNodeIds
    )

    setNodes((prev) =>
      prev.map((node) =>
        selectedSet.has(node.id)
          ? {
              ...node,
              data: {
                ...(node.data ?? {}),
                rotation: normalizeRotation(
                  (node.data.rotation ?? 0) - 90
                ),
              },
            }
          : node
      )
    )
  }

  function handleMouseMove(
    event: React.MouseEvent<HTMLDivElement>
  ) {
    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    })

    if (pickedNodeId) {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === pickedNodeId
            ? {
                ...node,
                position,
              }
            : node
        )
      )
    }

    if (resizeNodeId) {
      setNodes((prev) =>
        prev.map((node) => {
          if (node.id !== resizeNodeId)
            return node

          const width = Math.max(
            40,
            position.x - node.position.x
          )

          const height = Math.max(
            40,
            position.y - node.position.y
          )

          return {
            ...node,
            data: {
              ...(node.data ?? {}),
              width,
              height,
            },
          }
        })
      )
    }
  }

  function addBlankNode(type: string) {
    const defaultData: BlankNodeData = {
      label: '',

      fillColor: '#ffffff',
      strokeColor: '#111111',
      strokeWidth: 2,

      labelColor: '#111111',
      labelSize: 16,

      labelOffsetX: 0,
      labelOffsetY: 0,

      rotation: 0,

      editableStyle: true,
      editableLabel: true,
      editableInputCount: false,
    }

    const newNode: BlankNode = {
      id: `${type}-${crypto.randomUUID()}`,
      type,
      position: {
        x: 100,
        y: 100,
      },
      selected: false,
      data: defaultData,
    }

    pushHistorySnapshot()

    setNodes((prev) => [...prev, newNode])

    setSelectedNodeIds([newNode.id])
  }

  function deleteSelected() {
    if (selectedNodeIds.length === 0)
      return

    pushHistorySnapshot()

    const selectedSet = new Set(
      selectedNodeIds
    )

    setNodes((prev) =>
      prev.filter(
        (node) => !selectedSet.has(node.id)
      )
    )

    setSelectedNodeIds([])
  }

  useEffect(() => {
    function onKeyDown(
      event: KeyboardEvent
    ) {
      const target =
        event.target as HTMLElement | null

      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }

      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === 'z'
      ) {
        event.preventDefault()

        if (event.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }

        return
      }

      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === 'y'
      ) {
        event.preventDefault()
        handleRedo()
        return
      }

      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === 'a'
      ) {
        event.preventDefault()

        setSelectedNodeIds(
          nodes.map((node) => node.id)
        )

        return
      }

      if (
        event.key.toLowerCase() === 'r'
      ) {
        event.preventDefault()

        if (event.shiftKey) {
          rotateSelectedCounterClockwise()
        } else {
          rotateSelectedClockwise()
        }

        return
      }

      if (
        event.key === 'Backspace' ||
        event.key === 'Delete'
      ) {
        event.preventDefault()
        deleteSelected()
      }
    }

    window.addEventListener(
      'keydown',
      onKeyDown
    )

    return () =>
      window.removeEventListener(
        'keydown',
        onKeyDown
      )
  }, [nodes, selectedNodeIds])

  function handleDragOver(
    event: React.DragEvent<HTMLDivElement>
  ) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  function handleDrop(
    event: React.DragEvent<HTMLDivElement>
  ) {
    event.preventDefault()

    const raw =
      event.dataTransfer.getData(
        SIDEBAR_DRAG_MIME
      )

    if (!raw) return

    let item: SidebarModuleItem

    try {
      item = JSON.parse(raw)
    } catch {
      return
    }

    const position =
      screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

    const newNode: BlankNode = {
      id: `${item.type}-${crypto.randomUUID()}`,
      type: item.type,
      position,
      selected: false,
      data: {
        ...(item.defaultData ?? {}),
        rotation: 0,
      },
    }

    pushHistorySnapshot()

    setNodes((prev) => [
      ...prev,
      newNode,
    ])
  }

  const displayNodes = useMemo(() => {
    const selectedSet = new Set(
      selectedNodeIds
    )

    return nodes.map((node) => {
      const isSelected =
        selectedSet.has(node.id)

      const isPicked =
        pickedNodeId === node.id

      return {
        ...node,

        selected:
          isSelected || isPicked,

        style:
          isSelected || isPicked
            ? {
                boxShadow: isPicked
                  ? '0 0 0 2px #111'
                  : '0 0 0 2px #2563eb',

                borderRadius: 8,
              }
            : undefined,
      }
    })
  }, [
    nodes,
    selectedNodeIds,
    pickedNodeId,
  ])

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseUp={() => {
        setPickedNodeId(null)
        setResizeNodeId(null)
      }}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: '#fff',
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Header
        onSave={async () => null}
        onLoad={() => {}}
      />

      <TopToolbar
        deleteMode={false}
        canDelete={
          selectedNodeIds.length > 0
        }
        canRotate={
          selectedNodeIds.length > 0
        }
        onToggleDeleteMode={() => {}}
        onDelete={deleteSelected}
        onRotateClockwise={
          rotateSelectedClockwise
        }
        onRotateCounterClockwise={
          rotateSelectedCounterClockwise
        }
        onExportTikz={() => {}}
        sidebarOpen={leftOpen}
        rightSidebarOpen={rightOpen}
        onZoomIn={() =>
          void zoomIn({
            duration: 150,
          })
        }
        onZoomOut={() =>
          void zoomOut({
            duration: 150,
          })
        }
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      <LeftSidebar
        open={leftOpen}
        setOpen={setLeftOpen}
        modules={[
          {
            type: 'rectangle',
            label: 'Rectangle',
            category: 'Shapes',

            defaultData: {
              label: '',
              fillColor: '#ffffff',
              strokeColor: '#111111',
              strokeWidth: 2,

              labelColor: '#111111',
              labelSize: 16,

              labelOffsetX: 0,
              labelOffsetY: 0,

              editableStyle: true,
              editableLabel: true,
              editableInputCount: false,
            },
          },

          {
            type: 'circle',
            label: 'Circle',
            category: 'Shapes',

            defaultData: {
              label: '',
              fillColor: '#ffffff',
              strokeColor: '#111111',
              strokeWidth: 2,

              labelColor: '#111111',
              labelSize: 16,

              labelOffsetX: 0,
              labelOffsetY: 0,

              editableStyle: true,
              editableLabel: true,
              editableInputCount: false,
            },
          },
        ]}
      />

      <RightSidebar
        open={rightOpen}
        setOpen={setRightOpen}
        selectedNode={selectedNode}
        selectedEdge={null}
        selectedSegments={[]}
        selectedSegmentStyle={null}
        codeValue=""
        onCodeChange={() => {}}
        onResetCode={() => {}}
        onUpdateSelectedNodeData={
          updateSelectedNodeData
        }
        onUpdateSelectedEdgeData={() => {}}
        onUpdateSelectedSegmentsStyle={() => {}}
      />

      <ReactFlow
        nodes={displayNodes}
        edges={edges}
        nodeTypes={blankNodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(event, node) => {
          event.stopPropagation()

          const target =
            event.target as HTMLElement

          const isResizeHandle =
            target.dataset.resizeHandle ===
            'true'

          if (isResizeHandle) {
            setResizeNodeId(node.id)
            setPickedNodeId(null)
            return
          }

          if (event.shiftKey) {
            setSelectedNodeIds((prev) =>
              prev.includes(node.id)
                ? prev.filter(
                    (id) => id !== node.id
                  )
                : [...prev, node.id]
            )

            setPickedNodeId(null)

            return
          }

          setPickedNodeId((current) =>
            current === node.id
              ? null
              : node.id
          )

          setSelectedNodeIds([])
        }}
        onPaneClick={() => {
          setPickedNodeId(null)
          setResizeNodeId(null)
          setSelectedNodeIds([])
        }}
        fitView
      >
        {showGrid && (
          <Background
            gap={20}
            size={1.5}
            color="#bbb"
          />
        )}

        <Controls />
      </ReactFlow>
    </div>
  )
}

export default function BlankCanvas({
  leftOpen,
  setLeftOpen,
  setWorkspaceActions,
}: BlankCanvasProps) {
  return (
    <ReactFlowProvider>
      <BlankCanvasInner
        leftOpen={leftOpen}
        setLeftOpen={setLeftOpen}
        setWorkspaceActions={
          setWorkspaceActions
        }
      />
    </ReactFlowProvider>
  )
}