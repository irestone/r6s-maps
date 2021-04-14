/** @jsxImportSource @emotion/react */
import { FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { find, map, difference, uniqueId } from 'lodash'
import { proxy, useSnapshot } from 'valtio'

import { getLevelById } from '../../database'
import { VIEWPORTS_LIMIT } from '../../config'
import proxyState from '../../store'

const proxyLayoutState = proxy<{ size: [number, number] }>({ size: [0, 0] })

export const DEFAULT_VIEWPORT_SCALE = 4

// section #########################################################################################
//  VIEW
// #################################################################################################

type TView = {
  id: string
  level: number // TLevel{id}
  scale: number
  position: [any, any]
}

// ? where scale and position logic should be?
const createView = (level: number): TView => ({
  id: uniqueId(),
  level,
  scale: DEFAULT_VIEWPORT_SCALE,
  position: [0, 0],
})

const switchViewLevel = (view: TView, level: number): TView => ({ ...view, level })

const View: FC<
  TView & {
    width: number
    height: number
    onLevelSwitch: (viewId: string, levelId: number) => void
  }
> = ({ id, level: levelId, onLevelSwitch, width, height }) => {
  const levelElementRef = useRef<HTMLDivElement | null>(null)
  const blueprintElementRef = useRef<HTMLImageElement | null>(null)

  const state = useSnapshot(proxyState)
  const [scale, setScale] = useState<number>(1)

  const level = useMemo(() => getLevelById(levelId), [levelId])

  const [levelSize, setLevelSize] = useState<[number, number]>([0, 0])

  // update level size on blueprint change
  useLayoutEffect(() => {
    const levelElement = levelElementRef.current
    const blueprintElement = blueprintElementRef.current
    if (!blueprintElement || !levelElement) throw new Error('Unexpected Error.')

    const updateLevelSize = () => {
      blueprintElement.style.width = 'auto'
      blueprintElement.style.height = 'auto'
      const { width, height } = blueprintElement.getBoundingClientRect()
      levelElement.style.width = `${width}px`
      levelElement.style.height = `${height}px`
      blueprintElement.style.width = '100%'
      blueprintElement.style.height = '100%'
      setLevelSize([width, height])
    }

    blueprintElement.addEventListener('load', updateLevelSize)
    return () => blueprintElement.removeEventListener('load', updateLevelSize)
  }, [level.blueprint, setLevelSize])

  const levelTransformBase = useMemo(() => {
    const [levelWidth, levelHeight] = levelSize
    const levelAR = levelWidth / levelHeight
    const viewAR = width / height
    const scale = viewAR < levelAR ? height / levelHeight : width / levelWidth
    return `translate(${width / 2}px, ${height / 2}px) translate(-50%, -50%) scale(${scale})`
  }, [width, height, levelSize])

  const levelTransform = useMemo(() => {
    return `${levelTransformBase} scale(${scale})`
  }, [levelTransformBase, scale])

  const handleLevelSwitch = useCallback(
    ({ target }) => {
      onLevelSwitch(id, +target.value)
    },
    [onLevelSwitch, id]
  )

  return (
    <div
      css={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid blue',
      }}
    >
      <div ref={levelElementRef} css={{ transform: levelTransform, transition: 'all .3s' }}>
        <img
          ref={blueprintElementRef}
          src={level.blueprint}
          alt={level.type}
          css={{ display: 'block' }}
        />
      </div>
      <select
        value={level.id}
        onChange={handleLevelSwitch}
        css={{ position: 'absolute', top: 0, left: 0 }}
      >
        {state.map?.levels.map((item) => {
          const { id, type } = getLevelById(item)
          return (
            <option key={id} value={id}>
              {type}
            </option>
          )
        })}
      </select>
      <input
        type="range"
        min={1}
        max={4}
        step={0.1}
        value={scale}
        onChange={(event) => setScale(+event.target.value)}
        css={{ position: 'absolute', top: 0, left: 100 }}
      />
    </div>
  )
}

// section #########################################################################################
//  VIEWPORT
// #################################################################################################

type TViewport = {
  id: string
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

const viewportPositionMapping: {
  [position in TViewportPosition]: { size: [number, number]; xy: [number, number] }
} = {
  0: { size: [1.0, 1.0], xy: [0.0, 0.0] },
  1: { size: [0.5, 1.0], xy: [0.0, 0.0] },
  2: { size: [0.5, 1.0], xy: [0.5, 0.0] },
  3: { size: [0.5, 0.5], xy: [0.0, 0.0] },
  4: { size: [0.5, 0.5], xy: [0.5, 0.0] },
  5: { size: [0.5, 0.5], xy: [0.0, 0.5] },
  6: { size: [0.5, 0.5], xy: [0.5, 0.5] },
}

const createViewport = (view: TView, position: TViewportPosition): TViewport => ({
  id: uniqueId(),
  view,
  position,
})

// todo: Need to learn about a better approach to structure this kind of operations going through several abstraction barriers in FP.
const switchViewportLevel = (viewport: TViewport, level: number): TViewport => {
  const updatedView = switchViewLevel(viewport.view, level)
  return { ...viewport, view: updatedView }
}

const Viewport: FC<
  TViewport & {
    onViewportClose: (viewportId: string) => void
    onLevelSwitch: (viewId: string, levelId: number) => void
  }
> = ({ onViewportClose, onLevelSwitch, ...viewport }) => {
  const state = useSnapshot(proxyLayoutState)

  const positionStyles = useMemo(() => {
    const {
      size: [w, h],
      xy: [x, y],
    } = viewportPositionMapping[viewport.position]
    const [W, H] = state.size
    return { width: W * w, height: H * h, left: W * x, top: H * y }
  }, [viewport.position, state.size])

  return (
    <div
      css={{
        position: 'absolute',
        transition: 'all .3s',
        ...positionStyles,
      }}
    >
      <View
        {...viewport.view}
        onLevelSwitch={onLevelSwitch}
        width={positionStyles.width}
        height={positionStyles.height}
      />
      <button
        css={{ position: 'absolute', right: 0, top: 0 }}
        onClick={() => onViewportClose(viewport.id)}
      >
        x
      </button>
    </div>
  )
}

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

const removeViewport = (layout: TLayout, viewportId: string): TLayout => {
  const viewport = layout.find((item) => item.id === viewportId)
  if (!viewport) throw new Error(`The viewport is not found.`)
  const otherViewports = layout.filter((item) => item.id !== viewportId)
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
  const [layout, setLayout] = useState<TLayout>([])
  const layoutElementRef = useRef<HTMLDivElement | null>(null)

  // todo: Here I assume that: viewport -> view -> level -- 1 to 1 unique viewport to level relation but there are no rules and checks about that.
  useEffect(() => {
    setLayout((layout) => {
      const levels = map(layout, 'view.level')
      const removedLevels = difference(levels, state.levels)
      const addedLevels = difference(state.levels, levels)
      const updatedLayout1 = removedLevels
        .map((level) => find(layout, ['view.level', level])?.id as string)
        .reduce(removeViewport, layout)
      const updatedLayout2 = addedLevels.map(createView).reduce(addViewport, updatedLayout1)
      return updatedLayout2
    })
  }, [state.levels])

  // todo: level -> levelId everywhere
  const switchLevel = useCallback((viewId: string, levelId: number) => {
    setLayout((layout) => {
      const viewport = find(layout, ['view.id', viewId])
      if (!viewport) throw new Error('Viewport not found.')
      const updatedViewport = switchViewportLevel(viewport, levelId)
      const swapper = find(layout, ['view.level', levelId])
      const updatedSwapper = swapper && switchViewportLevel(swapper, viewport.view.level)
      const updatedLayout = layout.map((viewport) => {
        return viewport.id === updatedViewport.id
          ? updatedViewport
          : viewport.id === updatedSwapper?.id
          ? updatedSwapper
          : viewport
      })
      proxyState.levels = map(updatedLayout, 'view.level')
      return updatedLayout
    })
  }, [])

  const closeViewport = useCallback(
    (viewportId: string) => {
      const viewport = find(layout, { id: viewportId })
      if (!viewport) throw new Error('Viewport not found.')
      proxyState.levels = state.levels.filter((id) => id !== viewport.view.level)
    },
    [layout, state.levels]
  )

  useEffect(() => {
    proxyState.levels = state.map?.levels.slice(0, VIEWPORTS_LIMIT) || []
  }, [state.map])

  useLayoutEffect(() => {
    const setLayoutSize = () => {
      const layoutElement = layoutElementRef.current
      if (!layoutElement) throw new Error('Unexpected.')
      const { width, height } = layoutElement.getBoundingClientRect()
      console.log(width, height)
      proxyLayoutState.size = [width, height]
    }
    setLayoutSize()
    document.addEventListener('DOMContentLoaded', setLayoutSize)
    window.addEventListener('resize', setLayoutSize)
    return () => {
      document.removeEventListener('DOMContentLoaded', setLayoutSize)
      window.removeEventListener('resize', setLayoutSize)
    }
  }, [])

  return (
    <div
      ref={layoutElementRef}
      css={{ width: `calc(100% - 300px)`, height: '100%', position: 'absolute', top: 0, left: 300 }}
    >
      {layout.map((viewport) => (
        <Viewport
          key={viewport.id}
          {...viewport}
          onViewportClose={closeViewport}
          onLevelSwitch={switchLevel}
        />
      ))}
    </div>
  )
}

export default Layout
