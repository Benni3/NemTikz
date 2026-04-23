import { exportDiagramTikz } from './exportDiagramTikz'
import type { TikzExportInput } from './types'

export function exportFullLatexDocument(input: TikzExportInput): string {
  const tikz = exportDiagramTikz(input)

  return [
    '\\documentclass{article}',
    '\\usepackage{tikz}',
    '\\pagestyle{empty}',
    '\\begin{document}',
    '\\centering',
    tikz,
    '\\end{document}',
  ].join('\n')
}