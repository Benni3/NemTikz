import { useState } from 'react'
import CircuitCanvas from './CircuitCanvas'
import BlankCanvas from './BlankCanvas'
import DropDownMenu from '../ui/layout/DropDownMenu'
import type { WorkspaceActions } from './WorkspaceActions'
import WaveformPage from './waveformPage'

type WorkspaceMode = 'circuit' | 'blank' | 'waveform'

const LEFT_OPEN = 280
const LEFT_CLOSED = 52
const GAP = 20

export default function DrawingWorkspace() {
  const [mode, setMode] = useState<WorkspaceMode>('circuit')
  const [leftOpen, setLeftOpen] = useState(true)
  const [actions, setActions] = useState<WorkspaceActions>({})

  const isCircuit = mode === 'circuit'
  const isWaveform = mode === 'waveform'
  const leftSidebarWidth = leftOpen ? LEFT_OPEN : LEFT_CLOSED

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {isWaveform ? (
      <WaveformPage onBack={() => setMode('circuit')} />
    ) : isCircuit ? (
      <CircuitCanvas
        leftOpen={leftOpen}
        setLeftOpen={setLeftOpen}
        setWorkspaceActions={setActions}
      />
    ) : (
      <BlankCanvas
        leftOpen={leftOpen}
        setLeftOpen={setLeftOpen}
        setWorkspaceActions={setActions}
      />
    )}

      <DropDownMenu
        sections={[
          {
            title: 'Toolbar',
            items: [
              { label: 'Select', onClick: () => actions.selectMode?.() },
              { label: 'Label', onClick: () => actions.labelMode?.() },
              { label: 'Junction', onClick: () => actions.junctionMode?.() },
              { label: 'Export TikZ', onClick: () => actions.exportTikz?.() },
            ],
          },
          {
            title: 'Edit',
            items: [
              { label: 'Undo', onClick: () => actions.undo?.() },
              { label: 'Redo', onClick: () => actions.redo?.() },
              { label: 'Delete selected', onClick: () => actions.deleteSelected?.() },
              {
                label: 'Rotate',
                children: [
                  { label: 'Rotate +90°', onClick: () => actions.rotateClockwise?.() },
                  {
                    label: 'Rotate -90°',
                    onClick: () => actions.rotateCounterClockwise?.(),
                  },
                ],
              },
            ],
          },
          {
            title: isCircuit ? 'Circuit' : 'Blank',
            items: isCircuit
              ? [
                  {
                    label: 'Modes',
                    children: [
                      { label: 'Wire mode', onClick: () => actions.toggleWireMode?.() },
                      { label: 'Select', onClick: () => actions.selectMode?.() },
                      { label: 'Label', onClick: () => actions.labelMode?.() },
                      { label: 'Junction', onClick: () => actions.junctionMode?.() },
                    ],
                  },
                  {
                    label: 'Logic gates',
                    children: [
                      { label: 'AND', onClick: () => actions.addNode?.('andGate') },
                      { label: 'NAND', onClick: () => actions.addNode?.('nandGate') },
                      { label: 'OR', onClick: () => actions.addNode?.('orGate') },
                      { label: 'NOR', onClick: () => actions.addNode?.('norGate') },
                      { label: 'XOR', onClick: () => actions.addNode?.('xorGate') },
                      { label: 'XNOR', onClick: () => actions.addNode?.('xnorGate') },
                      { label: 'Buffer', onClick: () => actions.addNode?.('bufferGate') },
                      { label: 'Inverter', onClick: () => actions.addNode?.('invertGate') },
                    ],
                  },
                  {
                    label: 'Blocks',
                    children: [
                      { label: 'MUX', onClick: () => actions.addNode?.('muxGate') },
                      { label: 'Adder', onClick: () => actions.addNode?.('adderGate') },
                      {
                        label: 'Register',
                        onClick: () => actions.addNode?.('registerGate'),
                      },
                    ],
                  },
                ]
              : [
                  {
                    label: 'Shapes',
                    children: [
                      { label: 'Rectangle', onClick: () => actions.addNode?.('rectangle') },
                      { label: 'Circle', onClick: () => actions.addNode?.('circle') },
                    ],
                  },
                ],
          },
          {
            title: 'Pages',
            items: [
              { label: 'Circuit editor', onClick: () => setMode('circuit') },
              { label: 'Blank editor', onClick: () => setMode('blank') },
              { label: 'Timing diagram', onClick: () => setMode('waveform') },
            ],
          },
        ]}
      />

      {!isWaveform && (
  <div
    style={{
      position: 'absolute',
      left: leftSidebarWidth + GAP,
      bottom: 32,
      zIndex: 500,
      width: 220,
      height: 42,
      borderRadius: 999,
      border: '1px solid #d6d6d6',
      background: '#fff',
      padding: 4,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      boxSizing: 'border-box',
      transition: 'left 0.18s ease',
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: 4,
        left: 4,
        width: 'calc(50% - 4px)',
        height: 'calc(100% - 8px)',
        borderRadius: 999,
        background: '#111',
        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isCircuit ? 'translateX(0%)' : 'translateX(100%)',
      }}
    />

    <button
      type="button"
      onClick={() => setMode('circuit')}
      style={{
        border: 'none',
        background: 'transparent',
        color: isCircuit ? '#fff' : '#333',
        fontWeight: 700,
        cursor: 'pointer',
        zIndex: 1,
      }}
    >
      Circuit
    </button>

    <button
      type="button"
      onClick={() => setMode('blank')}
      style={{
        border: 'none',
        background: 'transparent',
        color: !isCircuit ? '#fff' : '#333',
        fontWeight: 700,
        cursor: 'pointer',
        zIndex: 1,
      }}
    >
      Blank
    </button>
  </div>
)}
    </div>
  )
}