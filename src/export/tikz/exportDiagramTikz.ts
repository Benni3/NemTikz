import { getSymbolDefinition } from '../../symbols/registry'
import { exportInlineInvertsTikz } from '../../symbols/gates/invert/InvertTikz'
import { exportEdgeTikz, exportPartialWireTikz } from './exportWireTikz'
import type { TikzExportInput } from './types'

export function exportDiagramTikz({
  nodes,
  edges,
  partialWires = [],
  inlineInverts = [],
}: TikzExportInput): string {
  const wireLines: string[] = []

  for (const edge of edges) {
    const line = exportEdgeTikz(edge, nodes)
    if (line.trim()) {
      wireLines.push(line)
    }
  }

  for (const wire of partialWires) {
    const line = exportPartialWireTikz(wire)
    if (line.trim()) {
      wireLines.push(line)
    }
  }

  const inlineInvertLines = exportInlineInvertsTikz(inlineInverts)

  const nodeLines = nodes.map((node) => {
    const def = getSymbolDefinition(node.type ?? '')
    if (!def) {
      return `% unsupported node type: ${node.type}`
    }

    return def.exportTikz(node)
  })

  return [
    '\\begin{tikzpicture}[line cap=round,line join=round,thick]',
    '',
    '% Wires',
    ...(wireLines.length > 0 ? wireLines : ['% no wires exported']),
    '',
    '% Inline inverter bubbles',
    ...(inlineInvertLines.trim()
      ? [inlineInvertLines]
      : ['% no inline inverters exported']),
    '',
    '% Gates / blocks',
    ...nodeLines,
    '',
    '\\end{tikzpicture}',
  ].join('\n')
}