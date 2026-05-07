export type WorkspaceActions = {
  // History
  undo?: () => void
  redo?: () => void

  // Selection
  deleteSelected?: () => void

  // Transform
  rotateClockwise?: () => void
  rotateCounterClockwise?: () => void

  // Modes
  toggleWireMode?: () => void
  selectMode?: () => void
  labelMode?: () => void
  junctionMode?: () => void

  // Creation
  addNode?: (type: string) => void

  // Export
  exportTikz?: () => void
}