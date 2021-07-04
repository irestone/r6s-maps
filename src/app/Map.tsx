/** @jsxImportSource @emotion/react */
import { SpringValue, useSprings } from '@react-spring/core'
import { filter, find, get, groupBy, map, noop, sortBy, uniqueId } from 'lodash'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { useSnapshot } from 'valtio'

import { getLevelById, getMapBySlug, TLevelType } from '../database'
import proxyState, { TControlsOrientation } from '../store'

import MapControl, { TMapControlProps } from './mapp/MapControl'
import Viewport, { TViewportProps, TViewportStatus, TViewportVariant } from './mapp/Viewport'

type TViewport = {
  id: string
  levelId: string
  status: TViewportStatus
  variant: TViewportVariant
  position: number
  width: SpringValue<number>
  height: SpringValue<number>
  x: SpringValue<number>
  y: SpringValue<number>
}

const levelsOrderMapping: { [type in TLevelType]: number } = {
  r: 0,
  '3f': 1,
  '2f': 2,
  '1f': 3,
  b: 4,
}

const sortByLevel = (viewports: TViewport[]) => {
  return viewports.slice().sort((v1, v2) => {
    const l1 = getLevelById(v1.levelId)
    const l2 = getLevelById(v2.levelId)
    return levelsOrderMapping[l1.type] - levelsOrderMapping[l2.type]
  })
}

const getLayoutSnapshot = (viewports: TViewport[]) => {
  return filter(viewports, { status: 'opened' })
    .map(({ position, variant }) => position + variant[0])
    .sort()
    .join('')
}

const layoutSnapshotMapping: {
  [snapshot: string]: {
    add: () => [number, [number, TViewportVariant]][]
    remove: (position: number) => [number, [number, TViewportVariant]][]
  }
} = {
  '': {
    add: () => [[-1, [0, 'full']]],
    remove: () => {
      throw new Error('Invalid operation')
    },
  },
  '0f': {
    add: () => [
      [-1, [0, 'half']],
      [0, [1, 'half']],
    ],
    remove: (position) => {
      if (position === 0) return []
      throw new Error('Invalid position')
    },
  },
  '0h1h': {
    add: () => [
      [-1, [0, 'half']],
      [0, [1, 'quadrant']],
      [1, [3, 'quadrant']],
    ],
    remove: (position) => {
      if (position === 0) return [[1, [0, 'full']]]
      if (position === 1) return [[0, [0, 'full']]]
      throw new Error('Invalid position')
    },
  },
  '0q1h2q': {
    add: () => [
      [-1, [0, 'quadrant']],
      [0, [1, 'quadrant']],
      [1, [3, 'quadrant']],
      [2, [2, 'quadrant']],
    ],
    remove: (position) => {
      if (position === 0)
        return [
          [2, [0, 'half']],
          [1, [1, 'half']],
        ]
      if (position === 1)
        return [
          [0, [0, 'half']],
          [2, [1, 'half']],
        ]
      if (position === 2)
        return [
          [0, [0, 'half']],
          [1, [1, 'half']],
        ]
      throw new Error('Invalid position')
    },
  },
  '0h1q3q': {
    add: () => [
      [-1, [0, 'quadrant']],
      [1, [1, 'quadrant']],
      [0, [2, 'quadrant']],
      [3, [3, 'quadrant']],
    ],
    remove: (position) => {
      if (position === 0)
        return [
          [1, [0, 'half']],
          [3, [1, 'half']],
        ]
      if (position === 1)
        return [
          [0, [0, 'half']],
          [3, [1, 'half']],
        ]
      if (position === 3)
        return [
          [0, [0, 'half']],
          [1, [1, 'half']],
        ]
      throw new Error('Invalid position')
    },
  },
  '0q1q2q3q': {
    add: () => {
      throw new Error('Invalid operation')
    },
    remove: (position) => {
      if (position === 0)
        return [
          [2, [0, 'half']],
          [1, [1, 'quadrant']],
          [3, [3, 'quadrant']],
        ]
      if (position === 1)
        return [
          [0, [0, 'quadrant']],
          [3, [1, 'half']],
          [2, [2, 'quadrant']],
        ]
      if (position === 2)
        return [
          [0, [0, 'half']],
          [1, [1, 'quadrant']],
          [3, [3, 'quadrant']],
        ]
      if (position === 3)
        return [
          [0, [0, 'quadrant']],
          [1, [1, 'half']],
          [2, [2, 'quadrant']],
        ]
      throw new Error('Invalid position')
    },
  },
}

// todo: swap viewports positions in layout when clicking a button on borders
// todo: zIndex of a viewport should be higher while it's open (including transition time)
// todo: style -> css

const PAD = 2

const Map = () => {
  const routerParams = useParams<{ map: string }>()
  const routerHistory = useHistory()
  const mapData = useMemo(() => getMapBySlug(routerParams.map), [routerParams.map])

  useEffect(() => {
    if (!mapData) return routerHistory.replace('/')
    proxyState.map = mapData
  }, [mapData, routerHistory])

  const { controls } = useSnapshot(proxyState)
  const [layoutSize, setLayoutSize] = useState({ width: 0, height: 0 })
  const [controlsSize, setControlsSize] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const setSizes = () => {
      const width = window.innerWidth - PAD * 2
      const height = window.innerHeight - PAD * 2
      const controlsSize =
        controls.orientation === 'horizontal' ? { width, height: 40 } : { width: 300, height }
      const layoutSize =
        controls.orientation === 'horizontal'
          ? { width, height: height - controlsSize.height }
          : { width: width - controlsSize.width, height }
      setControlsSize(controlsSize)
      setLayoutSize(layoutSize)
    }
    setSizes()
    window.addEventListener('resize', setSizes)
    return () => window.removeEventListener('resize', setSizes)
  }, [controls.orientation])

  const [springs] = useSprings(
    mapData.levels.length,
    () => ({ width: 0, height: 0, x: 0, y: 0, config: { tension: 700, friction: 60 } }),
    // () => ({ width: 0, height: 0, x: 0, y: 0, config: { tension: 1000, friction: 60 } }),
    []
  )

  const viewportsRef = useRef<TViewport[]>([])

  const [viewports, setViewports] = useState<TViewport[]>(() => {
    const status: TViewportStatus = 'closed'
    const variant: TViewportVariant = controls.orientation === 'horizontal' ? 'thumb' : 'minimized'
    const create = (levelId: string, i: number) => ({
      id: uniqueId(),
      levelId,
      status,
      variant,
      position: 0,
      ...springs[i],
    })
    const setPosition = (viewport: TViewport, position: number) => ({ ...viewport, position })
    const viewports = sortByLevel(mapData.levels.map(create)).map(setPosition)
    viewportsRef.current = viewports
    return viewports
  })

  const openVewport = useCallback((id: string) => {
    setViewports((viewports) => {
      const { opened = [], closed = [] } = groupBy(viewports, 'status')
      if (opened.length === 4) return viewports

      const updatedClosed = sortByLevel(closed.filter((item) => item.id !== id)).map(
        (item, position) => ({ ...item, position })
      )

      const viewport = find(viewports, { id })
      const add = layoutSnapshotMapping[getLayoutSnapshot(opened)].add
      if (!add || !viewport) throw new Error()

      const updatedOpened = add().map(([from, [to, variant]]) => {
        const v = from === -1 ? viewport : find(opened, { position: from })
        if (!v) throw new Error()
        const updatedViewport: TViewport = { ...v, status: 'opened', position: to, variant }
        return updatedViewport
      })

      return [...updatedClosed, ...updatedOpened]
    })
  }, [])

  const closeVewport = useCallback(
    (id: string) => {
      setViewports((viewports) => {
        const { opened = [], closed = [] } = groupBy(viewports, 'status')

        const viewport = find(viewports, { id })
        const status: TViewportStatus = 'closed'
        const variant: TViewportVariant =
          controls.orientation === 'horizontal' ? 'thumb' : 'minimized'
        if (!viewport) throw new Error()

        const updatedClosed = sortByLevel([...closed, viewport]).map((item, position) => ({
          ...item,
          status,
          variant,
          position,
        }))

        const remove = layoutSnapshotMapping[getLayoutSnapshot(opened)].remove
        if (!remove || !viewport) throw new Error()

        const updatedOpened = remove(viewport.position).map(([from, [to, variant]]) => {
          const v = find(opened, { position: from })
          if (!v) throw new Error()
          const updatedViewport: TViewport = { ...v, position: to, variant }
          return updatedViewport
        })

        return [...updatedClosed, ...updatedOpened]
      })
    },
    [controls.orientation]
  )

  useEffect(() => {
    viewportsRef.current.slice(0, 3).forEach(({ id }) => openVewport(id))
  }, [openVewport])

  const mapControlProps = useMemo<TMapControlProps>(
    () => ({
      variant: 'minimized',
      width: controls.orientation === 'horizontal' ? 300 : controlsSize.width,
      height: controls.orientation === 'horizontal' ? controlsSize.height : 200,
      left: PAD,
      top: PAD,
    }),
    [controls.orientation, controlsSize]
  )

  const viewportSizesMapping: {
    [variant in TViewportVariant]: { width: number; height: number }
  } = useMemo(
    () => ({
      thumb: { width: 200, height: controlsSize.height },
      minimized: { width: controlsSize.width, height: 100 },
      quadrant: { width: layoutSize.width / 2, height: layoutSize.height / 2 },
      half: { width: layoutSize.width / 2, height: layoutSize.height },
      full: { width: layoutSize.width, height: layoutSize.height },
    }),
    [layoutSize, controlsSize]
  )

  useEffect(() => {
    const variant: TViewportVariant = controls.orientation === 'horizontal' ? 'thumb' : 'minimized'
    setViewports((viewports) =>
      viewports.map((viewport) =>
        viewport.status === 'closed' ? { ...viewport, variant } : viewport
      )
    )
  }, [controls.orientation])

  // todo(fix): opened viewports positions are sometimes 'jumping' on controls orientation change
  useEffect(() => {
    if (!viewports.length) return
    const groups = groupBy(viewports, 'status')
    const hor = controls.orientation === 'horizontal'

    get(groups, 'closed', []).forEach(({ width, height, x, y, variant, position }) => {
      const size = viewportSizesMapping[variant]
      width.start({ to: size.width })
      height.start({ to: size.height })
      x.start({ to: hor ? PAD + mapControlProps.width + size.width * position : PAD })
      y.start({ to: hor ? PAD : PAD + mapControlProps.height + size.height * position })
    })

    const xPad = hor ? PAD : PAD + controlsSize.width
    const yPad = hor ? PAD + controlsSize.height : PAD
    const quadrantSize = viewportSizesMapping.quadrant

    get(groups, 'opened', []).forEach(({ width, height, x, y, variant, position }) => {
      const size = viewportSizesMapping[variant]
      width.start({ to: size.width })
      height.start({ to: size.height })
      x.start({ to: [0, 2].includes(position) ? xPad : xPad + quadrantSize.width })
      y.start({ to: [0, 1].includes(position) ? yPad : yPad + quadrantSize.height })
    })
  }, [viewports, controls.orientation, mapControlProps, viewportSizesMapping, controlsSize])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: '#222',
        // background:
        //   'url("https://www.toptal.com/designers/subtlepatterns/patterns/cartographer.png")',
      }}
    >
      <MapControl {...mapControlProps} />
      {viewports.map((props) => (
        <Viewport key={props.id} {...props} onOpen={openVewport} onClose={closeVewport} />
      ))}
    </div>
  )
}

export default Map
// /** @jsxImportSource @emotion/react */
// import { useCallback, useEffect, useMemo, useState } from 'react'
// import { useParams, useHistory } from 'react-router-dom'

// import { getMapById, getMapBySlug } from '../database'
// import proxyState from '../store'

// import Sidebar from './map/Sidebar'
// import Layout from './map/Layout'

// export type TLevelStatus = 'active' | 'enabled' | 'disabled'
// export type TLevel = { id: string; status: TLevelStatus }

// const Map = () => {
//   const [{ width, height }] = useState({ width: 1920, height: 970 })

//   const routerHistory = useHistory()
//   const routerParams = useParams<{ map: string }>()

//   const map = useMemo(() => getMapBySlug(routerParams.map), [routerParams.map])

//   const [levels, setLevels] = useState<TLevel[]>(
//     map.levels.map((id, i) => ({ id, status: i <= 4 ? 'enabled' : 'disabled' }))
//   )

//   useEffect(() => {
//     if (!map) return routerHistory.replace('/')
//     proxyState.map = map
//   }, [map, routerHistory])

//   const handleMapChange = useCallback(
//     (id: string) => {
//       const { slug } = getMapById(id)
//       routerHistory.push(`/${slug}`)
//     },
//     [routerHistory]
//   )

//   const handleLevelClick = useCallback(
//     (id: string) => {
//       const switches: { [status in TLevelStatus]: TLevelStatus } = {
//         active: 'enabled',
//         enabled: 'active',
//         disabled: 'disabled',
//       }
//       setLevels(
//         levels.map((level) =>
//           level.id === id ? { ...level, status: switches[level.status] } : level
//         )
//       )
//     },
//     [levels, setLevels]
//   )

//   return (
//     <div style={{ width, height, position: 'relative', overflow: 'hidden' }}>
//       <Sidebar
//         width={300}
//         height={height}
//         left={0}
//         top={0}
//         mapId={map.id}
//         levels={levels}
//         onMapChange={handleMapChange}
//         onLevelClick={handleLevelClick}
//       />
//       <Layout width={width - 300} height={height} left={300} levels={levels} top={0} />
//     </div>
//   )
// }

// export default Map
