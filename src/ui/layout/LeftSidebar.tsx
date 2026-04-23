import { useEffect, useMemo, useState } from 'react'

export type SidebarModuleItem = {
  type: string
  label: string
  category: string
  defaultData?: Record<string, unknown>
}

type LeftSidebarProps = {
  modules: SidebarModuleItem[]
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export const SIDEBAR_DRAG_MIME = 'application/x-nemtikz-node'

const WIDTH_OPEN = 280
const WIDTH_CLOSED = 52
const FAVORITES_STORAGE_KEY = 'nemtikz-sidebar-favorites'

export default function LeftSidebar({
  modules,
  open,
  setOpen,
}: LeftSidebarProps) {
  const sidebarWidth = open ? WIDTH_OPEN : WIDTH_CLOSED

  const [search, setSearch] = useState('')
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  const [favoritesCollapsed, setFavoritesCollapsed] = useState(false)
  const [favoriteKeys, setFavoriteKeys] = useState<string[]>([])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        setFavoriteKeys(parsed.filter((x): x is string => typeof x === 'string'))
      }
    } catch {
      // ignore malformed storage
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(favoriteKeys)
      )
    } catch {
      // ignore storage failures
    }
  }, [favoriteKeys])

  const normalizedSearch = search.trim().toLowerCase()

  const filteredModules = useMemo(() => {
    if (!normalizedSearch) return modules

    return modules.filter((item) => {
      return (
        item.label.toLowerCase().includes(normalizedSearch) ||
        item.type.toLowerCase().includes(normalizedSearch) ||
        item.category.toLowerCase().includes(normalizedSearch)
      )
    })
  }, [modules, normalizedSearch])

  const groupedModules = useMemo(() => {
    const groups = new Map<string, SidebarModuleItem[]>()

    for (const item of filteredModules) {
      const current = groups.get(item.category) ?? []
      current.push(item)
      groups.set(item.category, current)
    }

    return Array.from(groups.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([category, items]) => ({
        category,
        items: [...items].sort((a, b) => a.label.localeCompare(b.label)),
      }))
  }, [filteredModules])

  const favoriteModules = useMemo(() => {
    const favoriteSet = new Set(favoriteKeys)

    return modules
      .filter((item) => favoriteSet.has(getModuleKey(item)))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [modules, favoriteKeys])

  function getModuleKey(item: SidebarModuleItem) {
    return `${item.category}::${item.type}::${item.label}`
  }

  function isFavorite(item: SidebarModuleItem) {
    return favoriteKeys.includes(getModuleKey(item))
  }

  function toggleFavorite(item: SidebarModuleItem) {
    const key = getModuleKey(item)

    setFavoriteKeys((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    )
  }

  function toggleGroup(category: string) {
    setCollapsedGroups((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  function handleDragStart(
    event: React.DragEvent<HTMLDivElement>,
    item: SidebarModuleItem
  ) {
    event.dataTransfer.setData(SIDEBAR_DRAG_MIME, JSON.stringify(item))
    event.dataTransfer.effectAllowed = 'copy'
  }

  function renderModuleCard(item: SidebarModuleItem, compact = false) {
    const favorite = isFavorite(item)

    return (
      <div
        key={`${item.category}-${item.type}-${item.label}`}
        draggable
        onDragStart={(e) => handleDragStart(e, item)}
        title={item.label}
        style={{
          minHeight: 42,
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'space-between' : 'center',
          gap: 10,
          padding: open ? '0 10px 0 12px' : '0',
          border: '1px solid #d8d8d8',
          borderRadius: 10,
          background: '#fff',
          cursor: 'grab',
          fontSize: 14,
          fontWeight: 500,
          color: '#222',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            minWidth: 0,
            flex: 1,
            justifyContent: open ? 'flex-start' : 'center',
          }}
        >
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {open ? item.label : item.label[0]}
          </span>
        </div>

        {open && !compact && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleFavorite(item)
            }}
            title={favorite ? 'Remove from favorites' : 'Add to favorites'}
            style={{
              width: 26,
              height: 26,
              border: '1px solid #d6d6d6',
              borderRadius: 7,
              background: favorite ? '#fff7d6' : '#fff',
              cursor: 'pointer',
              fontSize: 14,
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            {favorite ? '★' : '☆'}
          </button>
        )}
      </div>
    )
  }

  function renderSectionHeader(
    title: string,
    collapsed: boolean,
    onToggle: () => void,
    count?: number
  ) {
    return (
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          border: 'none',
          background: 'transparent',
          padding: 0,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#666',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
          }}
        >
          {title}
        </span>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
          }}
        >
          {typeof count === 'number' && (
            <span
              style={{
                fontSize: 11,
                color: '#888',
                fontWeight: 600,
              }}
            >
              {count}
            </span>
          )}
          <span
            style={{
              fontSize: 14,
              color: '#666',
              width: 14,
              textAlign: 'center',
            }}
          >
            {collapsed ? '›' : '⌄'}
          </span>
        </div>
      </button>
    )
  }

  return (
    <aside
      style={{
        position: 'absolute',
        top: 68,
        left: 0,
        bottom: 0,
        width: sidebarWidth,
        background: '#fafafa',
        borderRight: '1px solid #ddd',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.18s ease',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'space-between' : 'center',
          padding: open ? '0 12px' : '0',
          borderBottom: '1px solid #e5e5e5',
          flexShrink: 0,
        }}
      >
        {open && (
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#222',
            }}
          >
            Modules
          </span>
        )}

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          style={{
            width: 32,
            height: 32,
            border: '1px solid #ccc',
            borderRadius: 8,
            background: '#fff',
            cursor: 'pointer',
            fontSize: 16,
            flexShrink: 0,
          }}
          title={open ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {open ? '‹' : '›'}
        </button>
      </div>

      {open && (
        <div
          style={{
            padding: '10px 12px 0 12px',
            borderBottom: '1px solid #ececec',
            flexShrink: 0,
          }}
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search components..."
            style={{
              width: '100%',
              height: 36,
              border: '1px solid #d8d8d8',
              borderRadius: 10,
              padding: '0 12px',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
              background: '#fff',
            }}
          />
          <div style={{ height: 10 }} />
        </div>
      )}

      <div
        style={{
          overflowY: 'auto',
          padding: open ? '12px' : '8px 6px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {open && (
          <section>
            {renderSectionHeader(
              'Favorites',
              favoritesCollapsed,
              () => setFavoritesCollapsed((prev) => !prev),
              favoriteModules.length
            )}

            {!favoritesCollapsed && (
              <div
                style={{
                  marginTop: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {favoriteModules.length > 0 ? (
                  favoriteModules.map((item) => renderModuleCard(item, true))
                ) : (
                  <div
                    style={{
                      fontSize: 12,
                      color: '#888',
                      padding: '4px 2px 0 2px',
                      lineHeight: 1.4,
                    }}
                  >
                    Star components to keep them here.
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {groupedModules.map((group) => {
          const isCollapsed = open ? !!collapsedGroups[group.category] : false

          return (
            <section key={group.category}>
              {open ? (
                <>
                  {renderSectionHeader(
                    group.category,
                    isCollapsed,
                    () => toggleGroup(group.category),
                    group.items.length
                  )}

                  {!isCollapsed && (
                    <div
                      style={{
                        marginTop: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      {group.items.map((item) => renderModuleCard(item))}
                    </div>
                  )}
                </>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {group.items.map((item) => renderModuleCard(item))}
                </div>
              )}
            </section>
          )
        })}

        {open && groupedModules.length === 0 && (
          <div
            style={{
              fontSize: 12,
              color: '#888',
              lineHeight: 1.4,
            }}
          >
            No components match your search.
          </div>
        )}
      </div>
    </aside>
  )
}