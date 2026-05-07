import { useEffect, useRef, useState } from 'react'

type MenuItem = {
  label: string
  shortcut?: string
  onClick?: () => void
  children?: MenuItem[]
}

type MenuSection = {
  title?: string
  items: MenuItem[]
}

type DropDownMenuProps = {
  sections: MenuSection[]
}

type SubmenuState = {
  path: string
  items: MenuItem[]
  x: number
  y: number
  level: number
}

const MENU_WIDTH = 300
const SUBMENU_WIDTH = 280
const MENU_MAX_HEIGHT = 460
const ITEM_HEIGHT = 42
const MARGIN = 12
const GAP = 8

function normalizeShortcut(shortcut: string) {
  return shortcut
    .toLowerCase()
    .replaceAll('cmd', 'meta')
    .replaceAll('command', 'meta')
    .replaceAll('ctrl', 'control')
    .replaceAll(' ', '')
}

function eventMatchesShortcut(event: KeyboardEvent, shortcut: string) {
  const normalized = normalizeShortcut(shortcut)
  const parts = normalized.split('+')

  const key = parts[parts.length - 1]

  const wantsMeta = parts.includes('meta')
  const wantsCtrl = parts.includes('control')
  const wantsShift = parts.includes('shift')
  const wantsAlt = parts.includes('alt')

  if (wantsMeta !== event.metaKey) return false
  if (wantsCtrl !== event.ctrlKey) return false
  if (wantsShift !== event.shiftKey) return false
  if (wantsAlt !== event.altKey) return false

  return event.key.toLowerCase() === key
}

function flattenItems(sections: MenuSection[]) {
  const result: MenuItem[] = []

  function walk(items: MenuItem[]) {
    for (const item of items) {
      result.push(item)
      if (item.children?.length) walk(item.children)
    }
  }

  for (const section of sections) {
    walk(section.items)
  }

  return result
}

export default function DropDownMenu({ sections }: DropDownMenuProps) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ x: 300, y: 200 })
  const [submenus, setSubmenus] = useState<SubmenuState[]>([])

  const mousePosRef = useRef({ x: 300, y: 200 })

  useEffect(() => {
    function handleMove(event: MouseEvent) {
      mousePosRef.current = {
        x: event.clientX,
        y: event.clientY,
      }
    }

    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null

      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)

      if (isTyping) return

      if (event.key === 'Escape') {
        closeMenu()
        return
      }

      if (event.key.toLowerCase() === 'm') {
        event.preventDefault()
        toggleMenuAtMouse()
        return
      }

      const allItems = flattenItems(sections)
      const matchedItem = allItems.find(
        (item) =>
          item.shortcut &&
          item.onClick &&
          eventMatchesShortcut(event, item.shortcut)
      )

      if (matchedItem?.onClick) {
        event.preventDefault()
        matchedItem.onClick()
        closeMenu()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [sections])

  function toggleMenuAtMouse() {
    const size = getMenuSize(sections)

    let x = mousePosRef.current.x
    let y = mousePosRef.current.y

    if (x + MENU_WIDTH > window.innerWidth - MARGIN) {
      x = window.innerWidth - MENU_WIDTH - MARGIN
    }

    if (y + size.height > window.innerHeight - MARGIN) {
      y = mousePosRef.current.y - size.height
    }

    setPosition({
      x: Math.max(MARGIN, x),
      y: Math.max(MARGIN, y),
    })

    setSubmenus([])
    setOpen((prev) => !prev)
  }

  function closeMenu() {
    setOpen(false)
    setSubmenus([])
  }

  function getMenuSize(menuSections: MenuSection[]) {
    const itemCount = menuSections.reduce((sum, section) => {
      return sum + section.items.length + (section.title ? 1 : 0)
    }, 0)

    return {
      width: MENU_WIDTH,
      height: Math.min(MENU_MAX_HEIGHT, itemCount * ITEM_HEIGHT + 36),
    }
  }

  function getSubmenuHeight(items: MenuItem[]) {
    return Math.min(MENU_MAX_HEIGHT, items.length * ITEM_HEIGHT + 20)
  }

  function getSubmenuPosition(parentElement: HTMLElement, items: MenuItem[]) {
    const rect = parentElement.getBoundingClientRect()
    const height = getSubmenuHeight(items)

    const spaceRight = window.innerWidth - rect.right - MARGIN
    const spaceLeft = rect.left - MARGIN

    const openRight = spaceRight >= SUBMENU_WIDTH || spaceRight >= spaceLeft

    let x = openRight
      ? rect.right + GAP
      : rect.left - SUBMENU_WIDTH - GAP

    let y = rect.top

    if (y + height > window.innerHeight - MARGIN) {
      y = window.innerHeight - height - MARGIN
    }

    return {
      x: Math.max(MARGIN, x),
      y: Math.max(MARGIN, y),
    }
  }

  function openSubmenu(
    path: string,
    level: number,
    items: MenuItem[],
    parentElement: HTMLElement
  ) {
    const pos = getSubmenuPosition(parentElement, items)

    setSubmenus((prev) => {
      const kept = prev.filter((menu) => menu.level < level)

      return [
        ...kept,
        {
          path,
          items,
          x: pos.x,
          y: pos.y,
          level,
        },
      ]
    })
  }

  function clearSubmenusFromLevel(level: number) {
    setSubmenus((prev) => prev.filter((menu) => menu.level < level))
  }

  function runItem(item: MenuItem) {
    item.onClick?.()
    closeMenu()
  }

  function renderItem(item: MenuItem, path: string, level: number) {
    const hasChildren = !!item.children?.length
    const active = submenus.some((menu) => menu.path === path)

    return (
      <button
        key={path}
        type="button"
        onMouseEnter={(event) => {
          if (hasChildren && item.children) {
            openSubmenu(path, level + 1, item.children, event.currentTarget)
          } else {
            clearSubmenusFromLevel(level + 1)
          }
        }}
        onClick={(event) => {
          event.stopPropagation()

          if (hasChildren && item.children) {
            openSubmenu(path, level + 1, item.children, event.currentTarget)
            return
          }

          runItem(item)
        }}
        onMouseDown={(event) => event.preventDefault()}
        style={{
          width: '100%',
          height: ITEM_HEIGHT,
          border: 'none',
          borderRadius: 10,
          background: active ? '#f1f1f1' : 'transparent',
          textAlign: 'left',
          padding: '0 12px',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 650,
          color: '#111',
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span>{item.label}</span>

        {item.shortcut && (
          <span
            style={{
              color: '#999',
              fontSize: 12,
              fontWeight: 650,
              whiteSpace: 'nowrap',
            }}
          >
            {item.shortcut}
          </span>
        )}

        {hasChildren && (
          <span
            style={{
              color: '#777',
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ›
          </span>
        )}
      </button>
    )
  }

  function renderMenuBox(
    content: React.ReactNode,
    x: number,
    y: number,
    width: number,
    zIndex: number
  ) {
    return (
      <div
        style={{
          position: 'fixed',
          left: x,
          top: y,
          zIndex,
          width,
          maxHeight: MENU_MAX_HEIGHT,
          overflowY: 'auto',
          background: '#fff',
          border: '1px solid #ddd',
          borderRadius: 14,
          padding: 10,
          boxShadow: '0 16px 42px rgba(0,0,0,0.18)',
        }}
      >
        {content}
      </div>
    )
  }

  if (!open) return null

  return (
    <div
      onMouseLeave={(event) => {
        const next = event.relatedTarget as Node | null
        if (next && event.currentTarget.contains(next)) return
        closeMenu()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <div style={{ pointerEvents: 'auto' }}>
        {renderMenuBox(
          sections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.title && (
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#777',
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                    padding: '8px 10px 6px',
                  }}
                >
                  {section.title}
                </div>
              )}

              {section.items.map((item, itemIndex) =>
                renderItem(item, `${sectionIndex}-${itemIndex}`, 0)
              )}

              {sectionIndex !== sections.length - 1 && (
                <div
                  style={{
                    height: 1,
                    background: '#eee',
                    margin: '10px 4px',
                  }}
                />
              )}
            </div>
          )),
          position.x,
          position.y,
          MENU_WIDTH,
          10000
        )}

        {submenus.map((submenu) =>
          renderMenuBox(
            submenu.items.map((item, itemIndex) =>
              renderItem(item, `${submenu.path}-${itemIndex}`, submenu.level)
            ),
            submenu.x,
            submenu.y,
            SUBMENU_WIDTH,
            10000 + submenu.level
          )
        )}
      </div>
    </div>
  )
}