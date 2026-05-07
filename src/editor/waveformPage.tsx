import { useEffect, useMemo, useRef, useState } from 'react'
import Header, {
  type AppFileHandle,
  getSavePickerWindow,
} from '../ui/layout/Header'
import {
  clampTime,
  exportWaveformTikz,
  generateClockPoints,
  makeDefaultWaveform,
  normalizeWaveformFile,
  sortPoints,
  type WaveformFile,
  type WavePoint,
  type WaveRegion,
  type WaveRegionKind,
  type WaveSignal,
  type WaveValue,
} from './waveform'

type WaveformPageProps = {
  onBack: () => void
}

type RightTab = 'edit' | 'tikz'
type GestureMode = 'select' | 'addPoint' | 'delay' | 'unknown' | 'highlight'

type DragState =
  | {
      kind: 'point'
      signalId: string
      pointIndex: number
    }
  | {
      kind: 'region-move'
      regionId: string
      startMouseTime: number
      originalStart: number
      originalEnd: number
    }
  | {
      kind: 'region-start'
      regionId: string
    }
  | {
      kind: 'region-end'
      regionId: string
    }
  | null

const LEFT_WIDTH = 280
const RIGHT_WIDTH = 360
const HEADER_HEIGHT = 68

const SVG_LEFT = 110
const SVG_TOP = 70
const SVG_WIDTH = 1000
const ROW_HEIGHT = 92
const HIGH = 28

const buttonStyle: React.CSSProperties = {
  height: 36,
  border: '1px solid #d0d0d0',
  borderRadius: 8,
  background: '#fff',
  color: '#111',
  padding: '0 12px',
  cursor: 'pointer',
  fontWeight: 600,
}

const activeButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: '#111',
  color: '#fff',
  borderColor: '#111',
}

const smallLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#666',
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 36,
  border: '1px solid #d8d8d8',
  borderRadius: 8,
  padding: '0 10px',
  boxSizing: 'border-box',
  background: '#fff',
  color: '#111',
}

function valueY(value: WaveValue, baseY: number) {
  if (value === 'high') return baseY - HIGH
  if (value === 'low') return baseY
  return baseY - HIGH / 2
}

function highY(baseY: number) {
  return baseY - HIGH
}

function lowY(baseY: number) {
  return baseY
}

function getSignalPoints(file: WaveformFile, signal: WaveSignal) {
  if (signal.kind === 'clock') {
    return generateClockPoints(file.duration, signal.period, signal.duty)
  }

  return sortPoints(signal.points)
}

function getValueFromY(mouseY: number, baseY: number): WaveValue {
  const highDistance = Math.abs(mouseY - highY(baseY))
  const lowDistance = Math.abs(mouseY - lowY(baseY))
  const unknownDistance = Math.abs(mouseY - valueY('unknown', baseY))

  if (unknownDistance < highDistance && unknownDistance < lowDistance) {
    return 'unknown'
  }

  return highDistance < lowDistance ? 'high' : 'low'
}

function makeDefaultInputSignal(file: WaveformFile): WaveSignal {
  return {
    id: crypto.randomUUID(),
    name: `A${file.signals.length}`,
    kind: 'input',
    points: [
      { time: 0, value: 'low', hardness: 10 },
      { time: Math.round(file.duration / 2), value: 'high', hardness: 10 },
      { time: file.duration, value: 'high', hardness: 10 },
    ],
  }
}

function makeDefaultClockSignal(file: WaveformFile): WaveSignal {
  return {
    id: crypto.randomUUID(),
    name: `Clk${file.signals.length}`,
    kind: 'clock',
    period: 2,
    duty: 0.5,
    points: [],
  }
}

function makeDefaultRegion(
  file: WaveformFile,
  signalId: string,
  kind: WaveRegionKind,
  startTime = 1,
  endTime = 3,
  height = 44,
): WaveRegion {
  return {
    id: crypto.randomUUID(),
    signalId,
    kind,
    startTime: clampTime(startTime, file.duration),
    endTime: clampTime(endTime, file.duration),
    height,
    label: kind === 'delay' ? 'delay' : kind === 'unknown' ? 'unknown' : '',
    color:
      kind === 'delay'
        ? '#facc15'
        : kind === 'unknown'
          ? '#9ca3af'
          : '#3b82f6',
      }
}

const COLOR_OPTIONS = [
  '#111111', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
  '#ff0000', '#ff5555', '#ff9900', '#ffaa00', '#ffff00', '#ffee88',
  '#00aa00', '#55ff55', '#00ffaa', '#00ffff', '#00aaff', '#0000ff',
  '#5555ff', '#9900ff', '#aa55ff', '#ff00aa', '#ff55cc', '#8b4513',
]

function isValidHex(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value)
}

function normalizeHex(value: string) {
  const cleaned = value.trim()
  if (cleaned.startsWith('#')) return cleaned
  return `#${cleaned}`
}

function ColorSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [customHex, setCustomHex] = useState(value)

  const safeValue = isValidHex(value) ? value : '#111111'
  const normalizedCustomHex = normalizeHex(customHex)
  const customIsValid = isValidHex(normalizedCustomHex)

  function applyCustomHex() {
    if (!customIsValid) return
    onChange(normalizedCustomHex.toLowerCase())
    setOpen(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setCustomHex(safeValue)
          setOpen((prev) => !prev)
        }}
        style={{
          width: '100%',
          height: 36,
          border: '1px solid #d8d8d8',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          padding: '0 10px',
          cursor: 'pointer',
          background: '#fff',
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: 4,
            background: safeValue,
            border: '1px solid #aaa',
            marginRight: 10,
          }}
        />
        <span style={{ fontSize: 13 }}>{safeValue}</span>
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 42,
            left: 0,
            width: '100%',
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: 10,
            padding: 8,
            zIndex: 9999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 6,
              marginBottom: 10,
            }}
          >
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onChange(color)
                  setOpen(false)
                }}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: 6,
                  background: color,
                  border:
                    safeValue.toLowerCase() === color.toLowerCase()
                      ? '2px solid #111'
                      : '1px solid #ccc',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              value={customHex}
              placeholder="#123abc"
              onChange={(e) => setCustomHex(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyCustomHex()
              }}
              style={{
                flex: 1,
                height: 34,
                border: customIsValid ? '1px solid #d8d8d8' : '1px solid #d33',
                borderRadius: 8,
                padding: '0 8px',
                boxSizing: 'border-box',
                fontFamily: 'monospace',
              }}
            />

            <button
              type="button"
              disabled={!customIsValid}
              onClick={applyCustomHex}
              style={{
                height: 34,
                padding: '0 10px',
                border: '1px solid #ccc',
                borderRadius: 8,
                background: customIsValid ? '#111' : '#eee',
                color: customIsValid ? '#fff' : '#888',
                cursor: customIsValid ? 'pointer' : 'not-allowed',
              }}
            >
              Apply
            </button>
          </div>

          <div
            style={{
              marginTop: 8,
              height: 24,
              borderRadius: 6,
              border: '1px solid #ddd',
              background: customIsValid ? normalizedCustomHex : '#fff',
            }}
          />
        </div>
      )}
    </div>
  )
}

function BlackValueSlider({
  value,
  min = 1,
  max = 10,
  onChange,
}: {
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
}) {
  const percent = ((value - min) / (max - min)) * 100

  return (
    <div
      style={{
        position: 'relative',
        height: 34,
        borderRadius: 999,
        background: '#e5e5e5',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${percent}%`,
          background: '#111',
          borderRadius: 999,
        }}
      />

      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          cursor: 'pointer',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          color: '#fff',
          fontSize: 13,
          fontWeight: 800,
          mixBlendMode: 'difference',
        }}
      >
        {value}
      </div>
    </div>
  )
}

export default function WaveformPage({ onBack }: WaveformPageProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)

  const [file, setFile] = useState<WaveformFile>(() => makeDefaultWaveform())
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(
    file.signals[0]?.id ?? null
  )
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null)
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null)
  const [rightTab, setRightTab] = useState<RightTab>('edit')
  const [gestureMode, setGestureMode] = useState<GestureMode>('select')
  const [dragState, setDragState] = useState<DragState>(null)
  const [undoStack, setUndoStack] = useState<WaveformFile[]>([])
  const [redoStack, setRedoStack] = useState<WaveformFile[]>([])
  const [copiedTikz, setCopiedTikz] = useState(false)

  const tikz = useMemo(() => exportWaveformTikz(file), [file])

  const selectedSignal =
    file.signals.find((signal) => signal.id === selectedSignalId) ?? null

  const selectedPoint =
    selectedSignal && selectedSignal.kind === 'input' && selectedPointIndex !== null
      ? selectedSignal.points[selectedPointIndex] ?? null
      : null

  const selectedRegion =
    selectedRegionId !== null
      ? file.regions.find((region) => region.id === selectedRegionId) ?? null
      : null

      

  function pushHistorySnapshot() {
  setUndoStack((prev) => [...prev, structuredClone(file)])
  setRedoStack([])
}

async function copyTikzToClipboard() {
  await navigator.clipboard.writeText(tikz)

  setCopiedTikz(true)

  setTimeout(() => {
    setCopiedTikz(false)
  }, 2000)
}

function undo() {
  setUndoStack((prev) => {
    if (prev.length === 0) return prev

    const last = prev[prev.length - 1]

    setRedoStack((redoPrev) => [...redoPrev, structuredClone(file)])
    setFile(last)

    setSelectedPointIndex(null)
    setSelectedRegionId(null)

    return prev.slice(0, -1)
  })
}

function redo() {
  setRedoStack((prev) => {
    if (prev.length === 0) return prev

    const next = prev[prev.length - 1]

    setUndoStack((undoPrev) => [...undoPrev, structuredClone(file)])
    setFile(next)

    setSelectedPointIndex(null)
    setSelectedRegionId(null)

    return prev.slice(0, -1)
  })
}

function deleteSelected() {
  if (selectedRegionId) {
    deleteSelectedRegion()
    return
  }

  if (selectedPointIndex !== null) {
    deleteSelectedPoint()
    return
  }

  if (selectedSignalId) {
    deleteSelectedSignal()
  }
}

useEffect(() => {
  function onKeyDown(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null

    const isTyping =
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable)

    if (isTyping) return

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault()

      if (event.shiftKey) {
        redo()
      } else {
        undo()
      }

      return
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y') {
      event.preventDefault()
      redo()
      return
    }

    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault()
      deleteSelected()
    }
  }

  window.addEventListener('keydown', onKeyDown)
  return () => window.removeEventListener('keydown', onKeyDown)
}, [file, undoStack, redoStack, selectedSignalId, selectedPointIndex, selectedRegionId])

  function timeFromMouse(clientX: number) {
    const svg = svgRef.current
    if (!svg) return 0

    const rect = svg.getBoundingClientRect()
    const localX = clientX - rect.left
    const raw = ((localX - SVG_LEFT) / SVG_WIDTH) * file.duration

    return Math.round(clampTime(raw, file.duration) * 10) / 10
  }

  function svgYFromMouse(clientY: number) {
    const svg = svgRef.current
    if (!svg) return 0

    const rect = svg.getBoundingClientRect()
    return clientY - rect.top
  }

  function updateFile(patch: Partial<WaveformFile>) {
    pushHistorySnapshot()
    setFile((prev) => ({ ...prev, ...patch }))
  }

  function addInput() {
    pushHistorySnapshot()
    setFile((prev) => {
      const signal = makeDefaultInputSignal(prev)

      setSelectedSignalId(signal.id)
      setSelectedPointIndex(null)
      setSelectedRegionId(null)
      setRightTab('edit')

      return {
        ...prev,
        signals: [...prev.signals, signal],
      }
    })
  }

  function addClock() {
    pushHistorySnapshot()
    setFile((prev) => {
      const signal = makeDefaultClockSignal(prev)

      setSelectedSignalId(signal.id)
      setSelectedPointIndex(null)
      setSelectedRegionId(null)
      setRightTab('edit')

      return {
        ...prev,
        signals: [...prev.signals, signal],
      }
    })
  }

  function deleteSelectedSignal() {
    pushHistorySnapshot()
    if (!selectedSignalId) return

    setFile((prev) => {
      const nextSignals = prev.signals.filter((signal) => signal.id !== selectedSignalId)

      return {
        ...prev,
        signals: nextSignals,
        regions: prev.regions.filter((region) => region.signalId !== selectedSignalId),
      }
    })

    setSelectedSignalId(null)
    setSelectedPointIndex(null)
    setSelectedRegionId(null)
  }

  function updateSignal(id: string, patch: Partial<WaveSignal>) {
    pushHistorySnapshot()
    setFile((prev) => ({
      ...prev,
      signals: prev.signals.map((signal) =>
        signal.id === id ? { ...signal, ...patch } : signal
      ),
    }))
  }

  function addPointAt(signalId: string, time: number, value: WaveValue = 'high') {
    pushHistorySnapshot()
    setFile((prev) => ({
      ...prev,
      signals: prev.signals.map((signal) => {
        if (signal.id !== signalId || signal.kind !== 'input') return signal

        const newPoint: WavePoint = {
          time: clampTime(time, prev.duration),
          value,
          hardness: 10,
        }

        const points = sortPoints([...signal.points, newPoint])
        const newIndex = points.findIndex((point) => point === newPoint)

        setSelectedSignalId(signal.id)
        setSelectedPointIndex(newIndex)
        setSelectedRegionId(null)
        setRightTab('edit')

        return {
          ...signal,
          points,
        }
      }),
    }))
  }

  function addPoint(signalId: string) {
    pushHistorySnapshot()
    addPointAt(signalId, Math.round(file.duration / 2), 'high')
  }

  function updatePoint(
    signalId: string,
    pointIndex: number,
    patch: Partial<WavePoint>,
    saveHistory = true
  ) {
    if (saveHistory) pushHistorySnapshot()
    setFile((prev) => ({
      ...prev,
      signals: prev.signals.map((signal) => {
        if (signal.id !== signalId || signal.kind !== 'input') return signal

        const updatedPoints = signal.points.map((point, index) =>
          index === pointIndex
            ? {
                ...point,
                ...patch,
                time:
                  typeof patch.time === 'number'
                    ? clampTime(patch.time, prev.duration)
                    : point.time,
              }
            : point
        )

        return {
          ...signal,
          points: sortPoints(updatedPoints),
        }
      }),
    }))
  }

  function deleteSelectedPoint() {
    pushHistorySnapshot()
    if (!selectedSignal || selectedSignal.kind !== 'input') return
    if (selectedPointIndex === null) return

    setFile((prev) => ({
      ...prev,
      signals: prev.signals.map((signal) =>
        signal.id === selectedSignal.id && signal.kind === 'input'
          ? {
              ...signal,
              points: signal.points.filter((_, index) => index !== selectedPointIndex),
            }
          : signal
      ),
    }))

    setSelectedPointIndex(null)
  }

  function addRegionAt(
    
    kind: WaveRegionKind,
    signalId: string,
    startTime = 1,
    endTime = 3
  ) {
    pushHistorySnapshot()
    setFile((prev) => {
      const region = makeDefaultRegion(prev, signalId, kind, startTime, endTime)

      setSelectedSignalId(signalId)
      setSelectedRegionId(region.id)
      setSelectedPointIndex(null)
      setRightTab('edit')

      return {
        ...prev,
        regions: [...prev.regions, region],
      }
    })
  }

  function addRegion(kind: WaveRegionKind) {
    pushHistorySnapshot()
    if (!selectedSignalId) return
    addRegionAt(kind, selectedSignalId)
  }

  function updateRegion(
  id: string,
  patch: Partial<WaveRegion>,
  saveHistory = true
) {
  if (saveHistory) pushHistorySnapshot()

  setFile((prev) => ({
    ...prev,
    regions: prev.regions.map((region) =>
      region.id === id
        ? {
            ...region,
            ...patch,
            startTime:
              typeof patch.startTime === 'number'
                ? clampTime(patch.startTime, prev.duration)
                : region.startTime,
            endTime:
              typeof patch.endTime === 'number'
                ? clampTime(patch.endTime, prev.duration)
                : region.endTime,
          }
        : region
    ),
  }))
}


  function deleteSelectedRegion() {
    pushHistorySnapshot()
    if (!selectedRegionId) return

    setFile((prev) => ({
      ...prev,
      regions: prev.regions.filter((region) => region.id !== selectedRegionId),
    }))

    setSelectedRegionId(null)
  }

  async function handleSave(
    fileHandle: AppFileHandle,
    forceChoose = false
  ): Promise<AppFileHandle> {
    const json = JSON.stringify(file, null, 2)
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
        suggestedName: 'waveform.json',
        types: [
          {
            description: 'Waveform JSON',
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

    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'waveform.json'
    a.click()

    URL.revokeObjectURL(url)

    return null
  }

  function handleLoad(fileToLoad: File) {
    pushHistorySnapshot()
    const reader = new FileReader()

    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        const normalized = normalizeWaveformFile(parsed)

        setFile(normalized)
        setSelectedSignalId(normalized.signals[0]?.id ?? null)
        setSelectedPointIndex(null)
        setSelectedRegionId(null)
      } catch {
        alert('Invalid waveform file')
      }
    }

    reader.readAsText(fileToLoad)
  }

  function downloadTikz() {
    const blob = new Blob([tikz], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'waveform.tex'
    a.click()

    URL.revokeObjectURL(url)
  }

  function handleWaveMouseMove(event: React.MouseEvent<SVGSVGElement>) {
    if (!dragState) return

    const time = timeFromMouse(event.clientX)

    if (dragState.kind === 'point') {
      updatePoint(dragState.signalId, dragState.pointIndex, { time }, false)
      return
    }

    if (dragState.kind === 'region-start') {
      updateRegion(dragState.regionId, { startTime: time }, false)
      return
    }

    if (dragState.kind === 'region-end') {
      updateRegion(dragState.regionId, { endTime: time }, false)
      return
    }

    if (dragState.kind === 'region-move') {
      const delta = time - dragState.startMouseTime
      updateRegion(dragState.regionId, {
        startTime: dragState.originalStart + delta,
        endTime: dragState.originalEnd + delta,
      })
    }
  }

  function handleSignalDoubleClick(
    event: React.MouseEvent,
    signal: WaveSignal,
    baseY: number
  ) {
    if (signal.kind !== 'input') return

    const time = timeFromMouse(event.clientX)
    const y = svgYFromMouse(event.clientY)
    const value = getValueFromY(y, baseY)

    addPointAt(signal.id, time, value)
  }

  function handleSignalClick(
    event: React.MouseEvent,
    signal: WaveSignal,
    baseY: number
  ) {
    const time = timeFromMouse(event.clientX)

    setSelectedSignalId(signal.id)
    setRightTab('edit')

    if (gestureMode === 'addPoint' && signal.kind === 'input') {
      const y = svgYFromMouse(event.clientY)
      const value = getValueFromY(y, baseY)
      addPointAt(signal.id, time, value)
      return
    }

    if (gestureMode === 'delay') {
      addRegionAt('delay', signal.id, time, Math.min(file.duration, time + 2))
      return
    }

    if (gestureMode === 'unknown') {
      addRegionAt('unknown', signal.id, time, Math.min(file.duration, time + 2))
      return
    }

    if (gestureMode === 'highlight') {
      addRegionAt('highlight', signal.id, time, Math.min(file.duration, time + 2))
    }
  }

  const svgHeight = SVG_TOP + file.signals.length * ROW_HEIGHT + 120

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#fff',
        overflow: 'hidden',
      }}
    >
      <Header
        title="NemTikz"
        centerTitle="Timing diagram mode"
        onTitleClick={onBack}
        onSave={handleSave}
        onLoad={handleLoad}
      />

      <aside
        style={{
          position: 'absolute',
          top: HEADER_HEIGHT,
          left: 0,
          bottom: 0,
          width: LEFT_WIDTH,
          borderRight: '1px solid #ddd',
          background: '#fafafa',
          zIndex: 100,
          padding: 14,
          boxSizing: 'border-box',
          overflowY: 'auto',
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 800, color: '#777', marginBottom: 8 }}>
          WAVEFORM ACTIONS
        </div>

        <button type="button" onClick={addInput} style={{ ...buttonStyle, width: '100%', marginBottom: 8 }}>
          New input
        </button>

        <button type="button" onClick={addClock} style={{ ...buttonStyle, width: '100%', marginBottom: 8 }}>
          New clock
        </button>

        <button
          type="button"
          onClick={downloadTikz}
          style={{ ...buttonStyle, width: '100%', marginBottom: 16 }}
        >
          Download TikZ
        </button>

        <div style={{ fontSize: 12, fontWeight: 800, color: '#777', marginBottom: 8 }}>
          MOUSE GESTURE
        </div>

        {[
          ['select', 'Select / drag'],
          ['addPoint', 'Click to add point'],
          ['delay', 'Click to add delay'],
          ['unknown', 'Click to add unknown'],
          ['highlight', 'Click to highlight'],
        ].map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            onClick={() => setGestureMode(mode as GestureMode)}
            style={{
              ...(gestureMode === mode ? activeButtonStyle : buttonStyle),
              width: '100%',
              marginBottom: 8,
            }}
          >
            {label}
          </button>
        ))}

        <div style={{ fontSize: 12, fontWeight: 800, color: '#777', margin: '16px 0 8px' }}>
          DIAGRAM SETTINGS
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={smallLabelStyle}>Title</div>
          <input
            value={file.title}
            onChange={(event) => updateFile({ title: event.target.value })}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={smallLabelStyle}>Duration</div>
          <input
            type="number"
            min={1}
            value={file.duration}
            onChange={(event) =>
              updateFile({ duration: Math.max(1, Number(event.target.value) || 10) })
            }
            style={inputStyle}
          />
        </div>

        <div style={{ fontSize: 12, fontWeight: 800, color: '#777', marginBottom: 8 }}>
          SIGNALS
        </div>

        {file.signals.map((signal) => (
          <button
            key={signal.id}
            type="button"
            onClick={() => {
              setSelectedSignalId(signal.id)
              setSelectedPointIndex(null)
              setSelectedRegionId(null)
              setRightTab('edit')
            }}
            style={{
              width: '100%',
              minHeight: 40,
              border:
                selectedSignalId === signal.id
                  ? '2px solid #2563eb'
                  : '1px solid #ddd',
              borderRadius: 10,
              background: '#fff',
              marginBottom: 8,
              cursor: 'pointer',
              textAlign: 'left',
              padding: '8px 10px',
              fontWeight: 700,
              color: '#111',
            }}
          >
            {signal.name}
            <span style={{ color: '#777', fontWeight: 500 }}> — {signal.kind}</span>
          </button>
        ))}
      </aside>

      <main
        style={{
          position: 'absolute',
          top: HEADER_HEIGHT,
          left: LEFT_WIDTH,
          right: RIGHT_WIDTH,
          bottom: 0,
          overflow: 'auto',
          background: '#fff',
        }}
      >
        <svg
          ref={svgRef}
          width={SVG_LEFT + SVG_WIDTH + 120}
          height={svgHeight}
          onMouseMove={handleWaveMouseMove}
          onMouseUp={() => setDragState(null)}
          onMouseLeave={() => setDragState(null)}
          style={{
            userSelect: 'none',
            cursor:
              gestureMode === 'select'
                ? 'default'
                : gestureMode === 'addPoint'
                  ? 'crosshair'
                  : 'cell',
          }}
        >
          {[...Array(Math.floor(file.duration) + 1)].map((_, index) => {
            const x = SVG_LEFT + (index / file.duration) * SVG_WIDTH

            return (
              <g key={`grid-${index}`}>
                <line x1={x} y1={40} x2={x} y2={svgHeight - 50} stroke="#eee" strokeWidth={1} />
                <text x={x} y={28} textAnchor="middle" fontSize={11} fill="#777">
                  {index}
                </text>
              </g>
            )
          })}

          {file.signals.map((signal, signalIndex) => {
            const baseY = SVG_TOP + signalIndex * ROW_HEIGHT
            const points = getSignalPoints(file, signal)
            const regions = file.regions.filter((region) => region.signalId === signal.id)
            const xFor = (time: number) => SVG_LEFT + (time / file.duration) * SVG_WIDTH

            return (
              <g
                key={signal.id}
                onDoubleClick={(event) => handleSignalDoubleClick(event, signal, baseY)}
                onClick={(event) => handleSignalClick(event, signal, baseY)}
              >
                <rect
                  x={0}
                  y={highY(baseY) - 20}
                  width={SVG_LEFT + SVG_WIDTH + 100}
                  height={ROW_HEIGHT}
                  fill="transparent"
                />

                <text x={24} y={baseY - 9} fontSize={20} fontWeight={800} fill="#111">
                  {signal.name}
                </text>

                <line x1={SVG_LEFT} y1={lowY(baseY)} x2={SVG_LEFT + SVG_WIDTH} y2={lowY(baseY)} stroke="#f1f1f1" />
                <line x1={SVG_LEFT} y1={highY(baseY)} x2={SVG_LEFT + SVG_WIDTH} y2={highY(baseY)} stroke="#f1f1f1" />

                {regions.map((region) => {
                  const x1 = xFor(region.startTime)
                  const x2 = xFor(region.endTime)
                  const regionHeight = region.height ?? HIGH + 16
                  const regionY = highY(baseY) - (regionHeight - HIGH) / 2

                  return (
                    <g key={region.id} onClick={(event) => event.stopPropagation()}>
                      {selectedRegionId === region.id && (
                        <rect
                          x={Math.min(x1, x2) - 6}
                          y={regionY - 6}
                          height={regionHeight + 12}
                          width={Math.abs(x2 - x1) + 12}
                          fill="none"
                          stroke={region.color ?? '#3b82f6'}
                          strokeWidth={4}
                          strokeOpacity={0.45}
                          rx={10}
                          pointerEvents="none"
                          style={{
                            filter: `drop-shadow(0 0 8px ${region.color ?? '#3b82f6'})`,
                          }}
                        />
                      )}

                      <rect
                        x={Math.min(x1, x2)}
                        y={regionY}
                        height={regionHeight}
                        width={Math.abs(x2 - x1)}
                        fill={region.color ?? '#3b82f6'}
                        fillOpacity={0.28}
                        stroke="none"
                        rx={6}
                        onMouseDown={(event) => {
                          event.preventDefault()
                          pushHistorySnapshot()
                          setSelectedSignalId(signal.id)
                          setSelectedRegionId(region.id)
                          setSelectedPointIndex(null)
                          setRightTab('edit')
                          setDragState({
                            kind: 'region-move',
                            regionId: region.id,
                            startMouseTime: timeFromMouse(event.clientX),
                            originalStart: region.startTime,
                            originalEnd: region.endTime,
                          })
                        }}
                        style={{
                          cursor: 'grab',
                          outline: 'none',
                        }}
                      />

                      <rect
                        x={x1 - 5}
                        y={regionY - 4}
                        height={regionHeight + 8}
                        width={10}
                        fill="transparent"
                        stroke="none"
                        onMouseDown={(event) => {
                          event.preventDefault()
                          pushHistorySnapshot()
                          setSelectedRegionId(region.id)
                          setDragState({ kind: 'region-start', regionId: region.id })
                        }}
                        style={{ cursor: 'ew-resize' }}
                      />

                      <rect
                        x={x2 - 5}
                        y={regionY - 4}
                        height={regionHeight + 8}
                        width={10}
                        fill="transparent"
                        stroke="none"
                        onMouseDown={(event) => {
                          event.preventDefault()
                          pushHistorySnapshot()
                          setSelectedRegionId(region.id)
                          setDragState({ kind: 'region-end', regionId: region.id })
                        }}
                        style={{ cursor: 'ew-resize' }}
                      />

                      {region.label && (
                        <text
                          x={(x1 + x2) / 2}
                          y={highY(baseY) - 12}
                          textAnchor="middle"
                          fontSize={12}
                          fill="#555"
                        >
                          {region.label}
                        </text>
                      )}
                    </g>
)
                })}

                {points.slice(0, -1).map((point, index) => {
                  const next = points[index + 1]
                  const x1 = xFor(point.time)
                  const x2 = xFor(next.time)
                  const y1 = valueY(point.value, baseY)
                  const y2 = valueY(next.value, baseY)
                  const selected = selectedSignalId === signal.id && selectedPointIndex === index + 1
                  const prev = points[index - 1]

                  const transitionHardness = next.hardness ?? 10
                  const isSmoothTransition =
                    point.value !== next.value &&
                    point.value !== 'unknown' &&
                    next.value !== 'unknown' &&
                    transitionHardness < 8

                  const curveWidth = isSmoothTransition
                    ? Math.max(4, 18 - transitionHardness)
                    : 0

                  const previousHardness = point.hardness ?? 10
                  const previousWasSmooth =
                    !!prev &&
                    prev.value !== point.value &&
                    prev.value !== 'unknown' &&
                    point.value !== 'unknown' &&
                    previousHardness < 8

                  const previousCurveWidth = previousWasSmooth
                    ? Math.max(4, 18 - previousHardness)
                    : 0

                  const horizontalStartX = x1 + previousCurveWidth
                  const horizontalEndX = x2 - curveWidth

                  return (
                    <g key={`${signal.id}-${index}`} onClick={(event) => event.stopPropagation()}>
                      {point.value === 'unknown' ? (
                          <>
                            <line x1={x1} y1={highY(baseY)} x2={x2} y2={highY(baseY)} stroke="#111" strokeWidth={2} strokeDasharray="6 5" strokeLinecap="round" />
                            <line x1={x1} y1={lowY(baseY)} x2={x2} y2={lowY(baseY)} stroke="#111" strokeWidth={2} strokeDasharray="6 5" strokeLinecap="round" />
                            <line x1={x1} y1={highY(baseY)} x2={x1} y2={lowY(baseY)} stroke="#111" strokeWidth={1.5} strokeDasharray="6 5" strokeLinecap="round" />
                            <line x1={x2} y1={highY(baseY)} x2={x2} y2={lowY(baseY)} stroke="#111" strokeWidth={1.5} strokeDasharray="6 5" strokeLinecap="round" />
                          </>
                        ) : (
                          <line
                            x1={horizontalStartX}
                            y1={y1}
                            x2={horizontalEndX}
                            y2={y1}
                            stroke="#111"
                            strokeWidth={2}
                            strokeLinecap="round"
                          />
                        )}

                     {point.value !== next.value && (
                        <path
                          d={
                            point.value === 'unknown' || next.value === 'unknown'
                              ? `M ${x2} ${highY(baseY)} L ${x2} ${lowY(baseY)}`
                              : isSmoothTransition
                                ? `M ${x2 - curveWidth} ${y1} C ${x2} ${y1}, ${x2} ${y2}, ${x2 + curveWidth} ${y2}`
                                : `M ${x2} ${y1} L ${x2} ${y2}`
                          }
                          stroke={selected ? '#2563eb' : '#111'}
                          strokeWidth={selected ? 4 : 2}
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeDasharray={
                            point.value === 'unknown' || next.value === 'unknown' ? '6 5' : undefined
                          }
                          onMouseDown={(event) => {
                            event.preventDefault()
                            pushHistorySnapshot()
                            if (signal.kind !== 'input') return
                            setSelectedSignalId(signal.id)
                            setSelectedPointIndex(index + 1)
                            setSelectedRegionId(null)
                            setRightTab('edit')
                            setDragState({
                              kind: 'point',
                              signalId: signal.id,
                              pointIndex: index + 1,
                            })
                          }}
                          style={{ cursor: signal.kind === 'input' ? 'ew-resize' : 'default' }}
                        />
                      )}

                      {signal.kind === 'input' && (
                        <circle
                          cx={x2}
                          cy={(y1 + y2) / 2}
                          r={selected ? 7 : 5}
                          fill={selected ? '#2563eb' : '#111'}
                          onMouseDown={(event) => {
                            event.preventDefault()
                            pushHistorySnapshot()
                            setSelectedSignalId(signal.id)
                            setSelectedPointIndex(index + 1)
                            setSelectedRegionId(null)
                            setRightTab('edit')
                            setDragState({
                              kind: 'point',
                              signalId: signal.id,
                              pointIndex: index + 1,
                            })
                          }}
                          style={{ cursor: 'ew-resize' }}
                        />
                      )}

                      {next.label && <text x={x2 + 7} y={y2 - 10} fontSize={12}>{next.label}</text>}
                      {next.delay && <text x={x2 + 7} y={y1 + 18} fontSize={12} fill="#777">{next.delay}</text>}
                    </g>
                  )
                })}
              </g>
            )
          })}
        </svg>
      </main>

      <aside
        style={{
          position: 'absolute',
          top: HEADER_HEIGHT,
          right: 0,
          bottom: 0,
          width: RIGHT_WIDTH,
          borderLeft: '1px solid #ddd',
          background: '#fafafa',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', gap: 8, padding: 12, borderBottom: '1px solid #e5e5e5' }}>
          <button
            type="button"
            onClick={() => setRightTab('edit')}
            style={{ ...(rightTab === 'edit' ? activeButtonStyle : buttonStyle), flex: 1 }}
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => setRightTab('tikz')}
            style={{ ...(rightTab === 'tikz' ? activeButtonStyle : buttonStyle), flex: 1 }}
          >
            TikZ
          </button>
        </div>

        {rightTab === 'edit' ? (
          <div style={{ padding: 14, overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>Inspector</h3>

            {!selectedSignal && <div style={{ color: '#777' }}>Select a signal.</div>}

            {selectedSignal && (
              <>
                <div style={{ marginBottom: 10 }}>
                  <div style={smallLabelStyle}>Signal name</div>
                  <input
                    value={selectedSignal.name}
                    onChange={(event) => updateSignal(selectedSignal.id, { name: event.target.value })}
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: 10 }}>
                  <div style={smallLabelStyle}>Type</div>
                  <div style={{ padding: 10, border: '1px solid #ddd', borderRadius: 8, background: '#fff' }}>
                    {selectedSignal.kind}
                  </div>
                </div>

                {selectedSignal.kind === 'clock' ? (
                  <>
                    <div style={{ marginBottom: 10 }}>
                      <div style={smallLabelStyle}>Clock period</div>
                      <input
                        type="number"
                        min={0.1}
                        step={0.1}
                        value={selectedSignal.period ?? 2}
                        onChange={(event) => updateSignal(selectedSignal.id, { period: Number(event.target.value) || 2 })}
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <div style={smallLabelStyle}>Duty cycle</div>
                      <input
                        type="number"
                        min={0.01}
                        max={0.99}
                        step={0.05}
                        value={selectedSignal.duty ?? 0.5}
                        onChange={(event) => updateSignal(selectedSignal.id, { duty: Number(event.target.value) || 0.5 })}
                        style={inputStyle}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => addPoint(selectedSignal.id)} style={{ ...buttonStyle, width: '100%', marginBottom: 8 }}>
                      Add edge / point
                    </button>

                    <button
                      type="button"
                      onClick={deleteSelectedPoint}
                      disabled={selectedPointIndex === null}
                      style={{ ...buttonStyle, width: '100%', opacity: selectedPointIndex === null ? 0.45 : 1 }}
                    >
                      Delete selected point
                    </button>
                  </>
                )}

                <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: 12, marginTop: 12 }}>
                  <div style={smallLabelStyle}>Colored areas</div>

                  <button type="button" onClick={() => addRegion('delay')} style={{ ...buttonStyle, width: '100%', marginBottom: 8 }}>
                    Add delay area
                  </button>

                  <button type="button" onClick={() => addRegion('unknown')} style={{ ...buttonStyle, width: '100%', marginBottom: 8 }}>
                    Add unknown area
                  </button>

                  <button type="button" onClick={() => addRegion('highlight')} style={{ ...buttonStyle, width: '100%', marginBottom: 8 }}>
                    Add highlight area
                  </button>

                  <button
                    type="button"
                    onClick={deleteSelectedRegion}
                    disabled={!selectedRegion}
                    style={{ ...buttonStyle, width: '100%', opacity: !selectedRegion ? 0.45 : 1 }}
                  >
                    Delete selected area
                  </button>
                </div>

                {selectedPoint && selectedPointIndex !== null && selectedSignal.kind === 'input' && (
                  <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: 12, marginTop: 12 }}>
                    <h4>Selected edge / point</h4>

                    <div style={{ marginBottom: 10 }}>
                      <div style={smallLabelStyle}>Time</div>
                      <input
                        type="number"
                        value={selectedPoint.time}
                        min={0}
                        max={file.duration}
                        onChange={(event) => updatePoint(selectedSignal.id, selectedPointIndex, { time: Number(event.target.value) })}
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <div style={smallLabelStyle}>Value after edge</div>
                      <select
                        value={selectedPoint.value}
                        onChange={(event) => updatePoint(selectedSignal.id, selectedPointIndex, { value: event.target.value as WaveValue })}
                        style={inputStyle}
                      >
                        <option value="low">Low</option>
                        <option value="high">High</option>
                        <option value="unknown">Unknown</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <div style={smallLabelStyle}>Edge hardness</div>
                      <BlackValueSlider
                        value={selectedPoint.hardness ?? 10}
                        min={1}
                        max={10}
                        onChange={(value) =>
                          updatePoint(selectedSignal.id, selectedPointIndex, {
                            hardness: value,
                          })
                        }
                      />
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <div style={smallLabelStyle}>Label</div>
                      <input
                        value={selectedPoint.label ?? ''}
                        onChange={(event) => updatePoint(selectedSignal.id, selectedPointIndex, { label: event.target.value })}
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <div style={smallLabelStyle}>Delay label</div>
                      <input
                        value={selectedPoint.delay ?? ''}
                        onChange={(event) => updatePoint(selectedSignal.id, selectedPointIndex, { delay: event.target.value })}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                )}

                {selectedRegion && (
                  <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: 12, marginTop: 12 }}>
                    <h4>Selected colored area</h4>

                    <div style={{ marginBottom: 10 }}>
                      <div style={smallLabelStyle}>Start time</div>
                      <input
                        type="number"
                        value={selectedRegion.startTime}
                        onChange={(event) => updateRegion(selectedRegion.id, { startTime: Number(event.target.value) })}
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <div style={smallLabelStyle}>End time</div>
                      <input
                        type="number"
                        value={selectedRegion.endTime}
                        onChange={(event) => updateRegion(selectedRegion.id, { endTime: Number(event.target.value) })}
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <div style={smallLabelStyle}>Region height</div>
                      <input
                        type="number"
                        min={10}
                        max={160}
                        value={selectedRegion.height ?? HIGH + 16}
                        onChange={(event) =>
                          updateRegion(selectedRegion.id, {
                            height: Number(event.target.value) || HIGH + 16,
                          })
                        }
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <div style={smallLabelStyle}>Kind</div>
                      <select
                        value={selectedRegion.kind}
                        onChange={(event) => updateRegion(selectedRegion.id, { kind: event.target.value as WaveRegionKind })}
                        style={inputStyle}
                      >
                        <option value="delay">Delay</option>
                        <option value="unknown">Unknown</option>
                        <option value="highlight">Highlight</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <div style={smallLabelStyle}>Label</div>
                      <input
                        value={selectedRegion.label ?? ''}
                        onChange={(event) => updateRegion(selectedRegion.id, { label: event.target.value })}
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <div style={smallLabelStyle}>Color</div>
                      <ColorSelect
                        value={selectedRegion.color ?? '#3b82f6'}
                        onChange={(color) =>
                          updateRegion(selectedRegion.id, {
                            color,
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: 12, marginTop: 12 }}>
                  <button type="button" onClick={deleteSelectedSignal} style={{ ...buttonStyle, width: '100%', color: '#b91c1c' }}>
                    Delete signal
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div
  style={{
    padding: 14,
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  }}
>
  <textarea
    value={tikz}
    readOnly
    style={{
      width: '100%',
      flex: 1,
      minHeight: 500,
      resize: 'none',
      border: '1px solid #d8d8d8',
      borderRadius: 10,
      padding: 12,
      boxSizing: 'border-box',
      background: '#fff',
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: 12,
      lineHeight: 1.45,
    }}
  />

  <button
    type="button"
    onClick={copyTikzToClipboard}
    style={{
      ...buttonStyle,
      width: '100%',
      height: 42,
      border: copiedTikz ? '1px solid #111' : '1px solid #111',
      background: copiedTikz ? '#fff' : '#111',
      color: copiedTikz ? '#111' : '#fff',
      transition: 'all 0.18s ease',
      flexShrink: 0,
    }}
  >
    {copiedTikz ? '✓ Copied' : 'Copy LaTeX code'}
  </button>
</div>
        )}
      </aside>
    </div>
  )
}