import { useRef } from 'react'

export type AppFileHandle =
  | {
      kind: 'browser-file-handle'
      handle: FileSystemFileHandle
    }
  | {
      kind: 'desktop-path'
      path: string
    }
  | null

type HeaderProps = {
  title?: string
  centerTitle?: string
  onTitleClick?: () => void
  onSave: (fileHandle: AppFileHandle, forceChoose?: boolean) => Promise<AppFileHandle>
  onLoad: (file: File) => void
}

type SaveFilePickerWindow = Window & {
  showSaveFilePicker?: (options?: {
    suggestedName?: string
    types?: Array<{
      description?: string
      accept: Record<string, string[]>
    }>
  }) => Promise<FileSystemFileHandle>
}

function getSavePickerWindow(): SaveFilePickerWindow {
  return window as SaveFilePickerWindow
}

const buttonStyle: React.CSSProperties = {
  height: 36,
  padding: '0 12px',
  border: '1px solid #d0d0d0',
  borderRadius: 8,
  background: '#fff',
  color: '#111',
  fontSize: 14,
  cursor: 'pointer',
}


export default function Header({
  title = 'NemTikz',
  centerTitle,
  onTitleClick,
  onSave,
  onLoad,
}: HeaderProps) {
  const currentFileRef = useRef<AppFileHandle>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  async function handleSave() {
    try {
      const updated = await onSave(currentFileRef.current, false)
      currentFileRef.current = updated
    } catch (error) {
      console.error('Save failed', error)
    }
  }

  async function handleSaveAs() {
    try {
      const updated = await onSave(currentFileRef.current, true)
      currentFileRef.current = updated
    } catch (error) {
      console.error('Save As failed', error)
    }
  }

  function handleLoadClick() {
    fileInputRef.current?.click()
  }

  function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    currentFileRef.current = null
    onLoad(file)
    event.currentTarget.value = ''
  }

  return (
    <header
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 68,
        background: '#fff',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '0 16px',
        zIndex: 2000,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flex: '1 1 auto',
        }}
      >
       <span
          onClick={onTitleClick}
          style={{
            fontSize: 26,
            fontWeight: 600,
            color: '#111',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            cursor: onTitleClick ? 'pointer' : 'default',
          }}
        >
          {title}
        </span>
      </div>

      {centerTitle && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 18,
              fontWeight: 700,
              color: '#111',
              pointerEvents: 'none',
            }}
          >
            {centerTitle}
          </div>
        )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flex: '0 0 auto',
        }}
      >
        <button type="button" onClick={handleSave} style={buttonStyle}>
          Save
        </button>

        <button type="button" onClick={handleSaveAs} style={buttonStyle}>
          Save As
        </button>

        <button type="button" onClick={handleLoadClick} style={buttonStyle}>
          Load
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />
    </header>
  )
}

export { getSavePickerWindow }