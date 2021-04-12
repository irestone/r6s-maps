/** @jsxImportSource @emotion/react */
import { CSSProperties, FC, useCallback, useEffect, useRef, useState } from 'react'
import { find, map, difference } from 'lodash'
import { useSnapshot } from 'valtio'

import { getLevelById } from '../../database'
import { VIEWPORTS_LIMIT } from '../../config'
import proxyState from '../../store'

export const DEFAULT_VIEWPORT_SCALE = 4

// section #########################################################################################
//  VIEW
// #################################################################################################

type TView = {
  level: number // TLevel{id}
  scale: number
  position: [any, any]
}

const createView = (level: number): TView => ({
  level,
  scale: DEFAULT_VIEWPORT_SCALE,
  position: [0, 0],
})

const View: FC<TView> = ({ level: levelId }) => {
  const level = getLevelById(levelId)
  return (
    <div
      css={{ width: '100%', height: '100%', background: `url(${level.blueprint}) center / cover` }}
    ></div>
  )
}

// section #########################################################################################
//  VIEWPORT
// #################################################################################################

type TViewport = {
  for: number // TLevel{id}
  view: TView
  position: TViewportPosition
}

type TViewportPosition =
  | 0 // full space
  | 1 // left half
  | 2 // right half
  | 3 // left-top quadrant
  | 4 // right-top quadrant
  | 5 // left-bottom quadrant
  | 6 // right-bottom quadrant

const viewportPosition2StyleMapping: { [position in TViewportPosition]: CSSProperties } = {
  0: { width: '100%', height: '100%', left: 0, top: 0 },
  1: { width: '50%', height: '100%', left: 0, top: 0 },
  2: { width: '50%', height: '100%', left: '50%', top: 0 },
  3: { width: '50%', height: '50%', left: 0, top: 0 },
  4: { width: '50%', height: '50%', left: '50%', top: 0 },
  5: { width: '50%', height: '50%', left: 0, top: '50%' },
  6: { width: '50%', height: '50%', left: '50%', top: '50%' },
}

const createViewport = (view: TView, position: TViewportPosition): TViewport => ({
  for: view.level,
  view,
  position,
})

const Viewport: FC<TViewport & { onViewportClose: () => void }> = ({
  onViewportClose,
  ...viewport
}) => (
  <div
    css={{
      position: 'absolute',
      border: '1px solid white',
      transition: 'all .3s',
      ...viewportPosition2StyleMapping[viewport.position],
    }}
  >
    <View {...viewport.view} />
    <button css={{ position: 'absolute', right: 0, top: 0 }} onClick={onViewportClose}>
      x
    </button>
  </div>
)

// section #########################################################################################
//  LAYOUT
// #################################################################################################

type TLayout = TViewport[]

const getLayoutSnapshot = (layout: TLayout) => map(layout, 'position').sort().join('')
// Possible layout snapshots: 0 | 12 | 146 | 235 | 3456

const changeViewportPosition = (
  layout: TLayout,
  from: TViewportPosition,
  to: TViewportPosition
): TLayout => {
  return layout.map((viewport) =>
    viewport.position === from ? { ...viewport, position: to } : viewport
  )
}

const addViewport = (layout: TLayout, view: TView): TLayout => {
  if (layout.length >= VIEWPORTS_LIMIT) throw new Error('Viewports limit reached.')
  const layoutSnapshot = getLayoutSnapshot(layout)
  switch (layoutSnapshot) {
    case '':
      return [createViewport(view, 0)]
    case '0':
      return [...changeViewportPosition(layout, 0, 1), createViewport(view, 2)]
    case '12':
      return [...changeViewportPosition(layout, 1, 3), createViewport(view, 5)]
    case '146':
      return [...changeViewportPosition(layout, 1, 3), createViewport(view, 5)]
    case '235':
      return [...changeViewportPosition(layout, 2, 4), createViewport(view, 6)]
    default:
      throw new Error(`Unhandled layout snapshot.`)
  }
}

const removeViewport = (layout: TLayout, levelId: number): TLayout => {
  const viewport = find(layout, { for: levelId })
  if (!viewport) throw new Error(`The viewport is not found.`)
  const otherViewports = layout.filter((item) => item.for !== levelId)
  const layoutSnapshot = getLayoutSnapshot(layout)
  const p = viewport.position
  switch (layoutSnapshot) {
    case '0':
      return []
    case '12': {
      if (p === 1) return changeViewportPosition(otherViewports, 2, 0)
      if (p === 2) return changeViewportPosition(otherViewports, 1, 0)
      throw new Error('Incorrect layout snapshot or viewport position.')
    }
    case '146': {
      if (p === 1) return changeViewportPosition(changeViewportPosition(otherViewports, 4, 1), 6, 2)
      if (p === 4) return changeViewportPosition(otherViewports, 6, 2)
      if (p === 6) return changeViewportPosition(otherViewports, 4, 2)
      throw new Error('Incorrect layout snapshot or viewport position.')
    }
    case '235': {
      if (p === 2) return changeViewportPosition(changeViewportPosition(otherViewports, 3, 1), 5, 2)
      if (p === 3) return changeViewportPosition(otherViewports, 5, 1)
      if (p === 5) return changeViewportPosition(otherViewports, 3, 1)
      throw new Error('Incorrect layout snapshot or viewport position.')
    }
    case '3456': {
      if (p === 3) return changeViewportPosition(otherViewports, 5, 1)
      if (p === 4) return changeViewportPosition(otherViewports, 6, 2)
      if (p === 5) return changeViewportPosition(otherViewports, 3, 1)
      if (p === 6) return changeViewportPosition(otherViewports, 4, 2)
      throw new Error('Incorrect layout snapshot or viewport position.')
    }
    default:
      throw new Error(`Unhandled layout snapshot.`)
  }
}

const Layout: FC = () => {
  const state = useSnapshot(proxyState)
  const cashedLayoutRef = useRef<TLayout>([])
  const [layout, setLayout] = useState<TLayout>([])

  useEffect(() => {
    const cashedLayout = cashedLayoutRef.current
    const cashedLevels = map(cashedLayout, 'for')
    const removedLevels = difference(cashedLevels, state.levels)
    const result1 = removedLevels.reduce(removeViewport, cashedLayout)
    const addedLevels = difference(state.levels, cashedLevels)
    const result2 = addedLevels.map(createView).reduce(addViewport, result1)
    cashedLayoutRef.current = result2
    setLayout(result2)
  }, [state.levels])

  const closeViewport = useCallback(
    (levelId: number) => {
      proxyState.levels = state.levels.filter((id) => id !== levelId)
    },
    [state.levels]
  )

  // const switchLevel = useCallback(
  //   (from: number, to: number) => {
  //     // ...
  //   },
  //   [state.levels]
  // )

  useEffect(() => {
    proxyState.levels = state.map?.levels.slice(0, VIEWPORTS_LIMIT) || []
  }, [state.map])

  return (
    <div css={{ position: 'relative' }}>
      {layout.map((viewport) => (
        <Viewport
          key={viewport.for}
          {...viewport}
          onViewportClose={() => closeViewport(viewport.for)}
        />
      ))}
    </div>
  )
}

export default Layout
