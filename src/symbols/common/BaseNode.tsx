import type { ReactNode } from 'react'

type BaseNodeProps = {
  children: ReactNode
  width?: number
  height?: number
}

export default function BaseNode({
  children,
  width = 110,
  height = 80,
}: BaseNodeProps) {
  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </div>
  )
}