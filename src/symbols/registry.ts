import type { SymbolDefinition } from './types'
import type { Point } from '../wires/OrthogonalEdge'

// AND gate
import {
  AndNode,
  getAndGeometry,
  getAndInputHandleId,
  getAndPinAnchor,
  type AndNodeData,
} from './gates/and/AndNode'
import { exportAndTikz } from './gates/and/AndTikz'

// OR gate
import {
  OrNode,
  getOrGeometry,
  getOrInputHandleId,
  getOrPinAnchor,
  type OrNodeData,
} from './gates/or/OrNode'
import { exportOrTikz } from './gates/or/OrTikz'

// NOR gate
import {
  NorNode,
  getNorGeometry,
  getNorInputHandleId,
  getNorPinAnchor,
  type NorNodeData,
} from './gates/nor/NorNode'
import { exportNorTikz } from './gates/nor/NorTikz'

// NAND gate
import {
  NandNode,
  getNandGeometry,
  getNandInputHandleId,
  getNandPinAnchor,
  type NandNodeData,
} from './gates/nand/NandNode'
import { exportNandTikz } from './gates/nand/NandTikz'

// XOR gate
import {
  XorNode,
  getXorGeometry,
  getXorInputHandleId,
  getXorPinAnchor,
  type XorNodeData,
} from './gates/xor/XorNode'
import { exportXorTikz } from './gates/xor/XorTikz'

// Buffer
import {
  BufferNode,
  getBufferGeometry,
  getBufferPinAnchor,
  type BufferNodeData,
} from './gates/buffer/BufferNode'
import { exportBufferTikz } from './gates/buffer/BufferTikz'

// Inverter
import {
  InvertNode,
  getInvertGeometry,
  getInvertPinAnchor,
  type InvertNodeData,
} from './gates/invert/InvertNode'
import { exportInvertTikz } from './gates/invert/InvertTikz'

// Adder
import {
  AdderNode,
  getAdderGeometry,
  getAdderPinAnchor,
  type AdderNodeData,
} from './blocks/adder/AdderNode'
import { exportAdderTikz } from './blocks/adder/AdderTikz'

// DFF
import {
  RegisterNode,
  getRegisterGeometry,
  getRegisterPinAnchor,
  type RegisterNodeData,
} from './blocks/register/RegisterNode'
import { exportRegisterTikz } from './blocks/register/RegisterTikz'

function rotatePointAround(
  point: Point,
  center: Point,
  rotation: number
): Point {
  const angle = (rotation * Math.PI) / 180
  const dx = point.x - center.x
  const dy = point.y - center.y

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  }
}

const andGeometry2 = getAndGeometry(2)
const orGeometry2 = getOrGeometry(2)
const norGeometry2 = getNorGeometry(2)
const xorGeometry2 = getXorGeometry(2)
const nandGeometry2 = getNandGeometry(2)
const bufferGeometry = getBufferGeometry()
const invertGeometry = getInvertGeometry()
const adderGeometry = getAdderGeometry()
const registerGeometry = getRegisterGeometry()

const adderDefinition: SymbolDefinition<AdderNodeData> = {
  type: 'adderGate',
  width: adderGeometry.width,
  height: adderGeometry.height,
  pins: [
    {
      id: 'inA',
      kind: 'target' as const,
      x: adderGeometry.inA.x,
      y: adderGeometry.inA.y,
    },
    {
      id: 'inB',
      kind: 'target' as const,
      x: adderGeometry.inB.x,
      y: adderGeometry.inB.y,
    },
    {
      id: 'out',
      kind: 'source' as const,
      x: adderGeometry.out.x,
      y: adderGeometry.out.y,
    },
  ],
  component: AdderNode,
  getAnchor: (nodeX: number, nodeY: number, handleId: string): Point => {
    return getAdderPinAnchor(nodeX, nodeY, handleId)
  },
  exportTikz: exportAdderTikz,
}

const registerDefinition: SymbolDefinition<RegisterNodeData> = {
  type: 'registerGate',
  width: registerGeometry.width,
  height: registerGeometry.height,
  pins: [
    {
      id: 'dIn',
      kind: 'target' as const,
      x: registerGeometry.dIn.x,
      y: registerGeometry.dIn.y,
    },
    {
      id: 'clkIn',
      kind: 'target' as const,
      x: registerGeometry.clkIn.x,
      y: registerGeometry.clkIn.y,
    },
    {
      id: 'qOut',
      kind: 'source' as const,
      x: registerGeometry.qOut.x,
      y: registerGeometry.qOut.y,
    },
    {
      id: 'bottomPin',
      kind: 'source' as const,
      x: registerGeometry.bottomPin.x,
      y: registerGeometry.bottomPin.y,
    },
  ],
  component: RegisterNode,
  getAnchor: (nodeX: number, nodeY: number, handleId: string): Point => {
    return getRegisterPinAnchor(nodeX, nodeY, handleId)
  },
  exportTikz: exportRegisterTikz,
}

const bufferDefinition: SymbolDefinition<BufferNodeData> = {
  type: 'bufferGate',
  width: bufferGeometry.width,
  height: bufferGeometry.height,
  pins: [
    {
      id: 'in',
      kind: 'target' as const,
      x: bufferGeometry.in.x,
      y: bufferGeometry.in.y,
    },
    {
      id: 'out',
      kind: 'source' as const,
      x: bufferGeometry.out.x,
      y: bufferGeometry.out.y,
    },
  ],
  component: BufferNode,
  getAnchor: (nodeX: number, nodeY: number, handleId: string): Point => {
    return getBufferPinAnchor(nodeX, nodeY, handleId)
  },
  exportTikz: exportBufferTikz,
}

const invertDefinition: SymbolDefinition<InvertNodeData> = {
  type: 'invertGate',
  width: invertGeometry.width,
  height: invertGeometry.height,
  pins: [
    {
      id: 'in',
      kind: 'target' as const,
      x: invertGeometry.in.x,
      y: invertGeometry.in.y,
    },
    {
      id: 'out',
      kind: 'source' as const,
      x: invertGeometry.out.x,
      y: invertGeometry.out.y,
    },
  ],
  component: InvertNode,
  getAnchor: (nodeX: number, nodeY: number, handleId: string): Point => {
    return getInvertPinAnchor(nodeX, nodeY, handleId)
  },
  exportTikz: exportInvertTikz,
}

const nandGateDefinition: SymbolDefinition<NandNodeData> = {
  type: 'nandGate',
  width: nandGeometry2.width,
  height: nandGeometry2.height,
  pins: [
    ...nandGeometry2.inputPins.map((pin, index) => ({
      id: getNandInputHandleId(index),
      kind: 'target' as const,
      x: pin.x,
      y: pin.y,
    })),
    {
      id: 'out',
      kind: 'source' as const,
      x: nandGeometry2.out.x,
      y: nandGeometry2.out.y,
    },
  ],
  component: NandNode,
  getAnchor: (nodeX: number, nodeY: number, handleId: string): Point => {
    return getNandPinAnchor(nodeX, nodeY, handleId, 2)
  },
  exportTikz: exportNandTikz,
}

const andGateDefinition: SymbolDefinition<AndNodeData> = {
  type: 'andGate',
  width: andGeometry2.width,
  height: andGeometry2.height,
  pins: [
    ...andGeometry2.inputPins.map((pin, index) => ({
      id: getAndInputHandleId(index),
      kind: 'target' as const,
      x: pin.x,
      y: pin.y,
    })),
    {
      id: 'out',
      kind: 'source' as const,
      x: andGeometry2.out.x,
      y: andGeometry2.out.y,
    },
  ],
  component: AndNode,
  getAnchor: (nodeX: number, nodeY: number, handleId: string): Point => {
    return getAndPinAnchor(nodeX, nodeY, handleId, 2)
  },
  exportTikz: exportAndTikz,
}

const orGateDefinition: SymbolDefinition<OrNodeData> = {
  type: 'orGate',
  width: orGeometry2.width,
  height: orGeometry2.height,
  pins: [
    ...orGeometry2.inputPins.map((pin, index) => ({
      id: getOrInputHandleId(index),
      kind: 'target' as const,
      x: pin.x,
      y: pin.y,
    })),
    {
      id: 'out',
      kind: 'source' as const,
      x: orGeometry2.out.x,
      y: orGeometry2.out.y,
    },
  ],
  component: OrNode,
  getAnchor: (nodeX: number, nodeY: number, handleId: string): Point => {
    return getOrPinAnchor(nodeX, nodeY, handleId, 2)
  },
  exportTikz: exportOrTikz,
}

const norGateDefinition: SymbolDefinition<NorNodeData> = {
  type: 'norGate',
  width: norGeometry2.width,
  height: norGeometry2.height,
  pins: [
    ...norGeometry2.inputPins.map((pin, index) => ({
      id: getNorInputHandleId(index),
      kind: 'target' as const,
      x: pin.x,
      y: pin.y,
    })),
    {
      id: 'out',
      kind: 'source' as const,
      x: norGeometry2.out.x,
      y: norGeometry2.out.y,
    },
  ],
  component: NorNode,
  getAnchor: (nodeX: number, nodeY: number, handleId: string): Point => {
    return getNorPinAnchor(nodeX, nodeY, handleId, 2)
  },
  exportTikz: exportNorTikz,
}

const xorGateDefinition: SymbolDefinition<XorNodeData> = {
  type: 'xorGate',
  width: xorGeometry2.width,
  height: xorGeometry2.height,
  pins: [
    ...xorGeometry2.inputPins.map((pin, index) => ({
      id: getXorInputHandleId(index),
      kind: 'target' as const,
      x: pin.x,
      y: pin.y,
    })),
    {
      id: 'out',
      kind: 'source' as const,
      x: xorGeometry2.out.x,
      y: xorGeometry2.out.y,
    },
  ],
  component: XorNode,
  getAnchor: (nodeX: number, nodeY: number, handleId: string): Point => {
    return getXorPinAnchor(nodeX, nodeY, handleId, 2)
  },
  exportTikz: exportXorTikz,
}

export const symbolRegistry = {
  andGate: andGateDefinition,
  orGate: orGateDefinition,
  norGate: norGateDefinition,
  xorGate: xorGateDefinition,
  nandGate: nandGateDefinition,
  bufferGate: bufferDefinition,
  invertGate: invertDefinition,
  adderGate: adderDefinition,
  registerGate: registerDefinition,
} satisfies Record<string, SymbolDefinition>

export type RegisteredSymbolType = keyof typeof symbolRegistry

export function getSymbolDefinition(type: string): SymbolDefinition | null {
  return symbolRegistry[type as RegisteredSymbolType] ?? null
}

export function getNodeAnchor(
  nodeType: string | undefined,
  nodeX: number,
  nodeY: number,
  handleId: string,
  nodeData?: Record<string, unknown>
): Point {
  if (!nodeType) {
    return { x: nodeX, y: nodeY }
  }

  const inputCount =
    typeof nodeData?.inputCount === 'number' ? nodeData.inputCount : 2

  const rotation =
    typeof nodeData?.rotation === 'number' ? nodeData.rotation : 0

  function applyRotation(anchor: Point, geometry: { centerX: number; centerY: number }) {
    const center = {
      x: nodeX + geometry.centerX,
      y: nodeY + geometry.centerY,
    }

    return rotatePointAround(anchor, center, rotation)
  }

  // -------- LOGIC GATES --------

  if (nodeType === 'andGate') {
    const geometry = getAndGeometry(inputCount)
    const anchor = getAndPinAnchor(nodeX, nodeY, handleId, inputCount)
    return applyRotation(anchor, geometry)
  }

  if (nodeType === 'orGate') {
    const geometry = getOrGeometry(inputCount)
    const anchor = getOrPinAnchor(nodeX, nodeY, handleId, inputCount)
    return applyRotation(anchor, geometry)
  }

  if (nodeType === 'nandGate') {
    const geometry = getNandGeometry(inputCount)
    const anchor = getNandPinAnchor(nodeX, nodeY, handleId, inputCount)
    return applyRotation(anchor, geometry)
  }

  if (nodeType === 'norGate') {
    const geometry = getNorGeometry(inputCount)
    const anchor = getNorPinAnchor(nodeX, nodeY, handleId, inputCount)
    return applyRotation(anchor, geometry)
  }

  if (nodeType === 'xorGate') {
    const geometry = getXorGeometry(inputCount)
    const anchor = getXorPinAnchor(nodeX, nodeY, handleId, inputCount)
    return applyRotation(anchor, geometry)
  }

  // -------- SIMPLE GATES --------

  if (nodeType === 'bufferGate') {
    const geometry = getBufferGeometry()
    const anchor = getBufferPinAnchor(nodeX, nodeY, handleId)
    return applyRotation(anchor, geometry)
  }

  if (nodeType === 'invertGate') {
    const geometry = getInvertGeometry()
    const anchor = getInvertPinAnchor(nodeX, nodeY, handleId)
    return applyRotation(anchor, geometry)
  }

  // -------- BLOCKS --------

  if (nodeType === 'adderGate') {
    const geometry = getAdderGeometry()
    const anchor = getAdderPinAnchor(nodeX, nodeY, handleId)
    return applyRotation(anchor, geometry)
  }

  if (nodeType === 'registerGate') {
    const geometry = getRegisterGeometry()
    const anchor = getRegisterPinAnchor(nodeX, nodeY, handleId)
    return applyRotation(anchor, geometry)
  }

  // -------- FALLBACK --------

  const def = getSymbolDefinition(nodeType)
  if (!def) {
    return { x: nodeX, y: nodeY }
  }

  return def.getAnchor(nodeX, nodeY, handleId)
}

export const nodeTypes = Object.fromEntries(
  Object.values(symbolRegistry).map((def) => [def.type, def.component])
)