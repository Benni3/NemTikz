import DrawingWorkspace from '../editor/DrawingWorkspace'

export default function AppShell() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <DrawingWorkspace />
    </div>
  )
}