/** @jsxImportSource @emotion/react */
import { difference, filter, find, isNull, map, sortBy, uniqueId } from 'lodash'
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import Viewport, { TViewportProps } from './Viewport'
import { TLevel } from '../Map'

type TViewportPosition =
  | 0 // full space
  | 1 // left half
  | 2 // right half
  | 3 // left-top quadrant
  | 4 // right-top quadrant
  | 5 // left-bottom quadrant
  | 6 // right-bottom quadrant

type TViewport = TViewportProps & { position: TViewportPosition }

const getLayoutSnapshot = (viewports: TViewport[]) => {
  return map(viewports, 'position').sort().join('')
}

const layoutSnapshotMapping: {
  [layoutSnapshot: string]: {
    add: () => (null | TViewportPosition)[][]
    remove: (position: TViewportPosition) => TViewportPosition[][]
  }
} = {
  '': {
    add: () => [[null, 0]],
    remove: () => {
      throw new Error('Invalid operation')
    },
  },
  '0': {
    add: () => [
      [0, 1],
      [null, 2],
    ],
    remove: (position) => {
      if (position === 0) return []
      throw new Error('Invalid position')
    },
  },
  '12': {
    add: () => [
      [2, 2],
      [1, 3],
      [null, 5],
    ],
    remove: (position) => {
      if (position === 1) return [[2, 0]]
      if (position === 2) return [[1, 0]]
      throw new Error('Invalid position')
    },
  },
  '146': {
    add: () => [
      [1, 3],
      [4, 4],
      [null, 5],
      [6, 6],
    ],
    remove: (position) => {
      if (position === 1)
        return [
          [4, 1],
          [6, 2],
        ]
      if (position === 4)
        return [
          [1, 1],
          [6, 2],
        ]
      if (position === 6)
        return [
          [1, 1],
          [4, 2],
        ]
      throw new Error('Invalid position')
    },
  },
  '235': {
    add: () => [
      [3, 3],
      [2, 4],
      [5, 5],
      [null, 6],
    ],
    remove: (position) => {
      if (position === 2)
        return [
          [3, 1],
          [5, 2],
        ]
      if (position === 3)
        return [
          [5, 1],
          [2, 2],
        ]
      if (position === 5)
        return [
          [3, 1],
          [2, 2],
        ]
      throw new Error('Invalid position')
    },
  },
  '3456': {
    add: () => {
      throw new Error('Invalid operation')
    },
    remove: (position) => {
      if (position === 3)
        return [
          [5, 1],
          [4, 4],
          [6, 6],
        ]
      if (position === 4)
        return [
          [6, 2],
          [3, 3],
          [5, 5],
        ]
      if (position === 5)
        return [
          [3, 1],
          [4, 4],
          [6, 6],
        ]
      if (position === 6)
        return [
          [4, 2],
          [3, 3],
          [5, 5],
        ]
      throw new Error('Invalid position')
    },
  },
}

const Layout: FC<{
  width: number
  height: number
  left: number
  top: number
  levels: TLevel[]
}> = ({ width, height, left, top, levels }) => {
  const [viewports, setViewports] = useState<TViewport[]>([])

  const viewportPositionPropsMapping: {
    [position in TViewportPosition]: { width: number; height: number; left: number; top: number }
  } = useMemo(() => {
    return {
      0: { width, height, left: 0, top: 0 },
      1: { width: width / 2, height, left: 0, top: 0 },
      2: { width: width / 2, height, left: width / 2, top: 0 },
      3: { width: width / 2, height: height / 2, left: 0, top: 0 },
      4: { width: width / 2, height: height / 2, left: width / 2, top: 0 },
      5: { width: width / 2, height: height / 2, left: 0, top: height / 2 },
      6: { width: width / 2, height: height / 2, left: width / 2, top: height / 2 },
    }
  }, [width, height])

  const changeViewportLevel = useCallback((viewportId: string, levelId: string) => {}, [])
  const closeViewport = useCallback((viewportId: string) => {}, [])

  useEffect(() => {
    setViewports((viewports) => {
      const viewingLevels = map(viewports, 'levelId')
      const activeLevels = map(filter(levels, { status: 'active' }), 'id')
      const toRemove = difference(viewingLevels, activeLevels)
      const toAdd = difference(activeLevels, viewingLevels)

      const removed = toRemove.reduce((acc, levelId) => {
        const viewport = find(acc, { levelId })
        if (!viewport) throw new Error()
        const remove = layoutSnapshotMapping[getLayoutSnapshot(acc)].remove
        return remove(viewport.position).map(([from, to]) => {
          const viewportOnPosition = find(acc, { position: from })
          if (!viewportOnPosition) throw new Error()
          return { ...viewportOnPosition, position: to, ...viewportPositionPropsMapping[to] }
        })
      }, viewports)

      const added = toAdd.reduce((acc, levelId) => {
        const add = layoutSnapshotMapping[getLayoutSnapshot(acc)].add
        return add().map(([from, to]) => {
          if (isNull(to)) throw new Error()
          if (isNull(from)) {
            const id = uniqueId()
            const position = to
            const positionProps = viewportPositionPropsMapping[to]
            const onLevelChange = () => changeViewportLevel(id, levelId)
            const onClose = () => closeViewport(id)
            return { id, levelId, position, onLevelChange, onClose, ...positionProps }
          }
          const viewportOnPosition = find(acc, { position: from })
          if (!viewportOnPosition) throw new Error()
          return { ...viewportOnPosition, position: to, ...viewportPositionPropsMapping[to] }
        })
      }, removed)

      return sortBy(added, ['id'])
    })
  }, [levels, viewportPositionPropsMapping, changeViewportLevel, closeViewport])

  useEffect(() => {
    setViewports((viewports) => {
      return viewports.map((viewport) => {
        return { ...viewport, ...viewportPositionPropsMapping[viewport.position] }
      })
    })
  }, [viewportPositionPropsMapping])

  return (
    <div style={{ width, height, position: 'absolute', left, top }}>
      {viewports.map((props) => (
        <Viewport key={props.id} {...props} />
      ))}
      {viewports.length > 1 && (
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            position: 'absolute',
            top: height / 2,
            left: width / 2,
            transform: 'translate(-50%, -50%)',
            background: '#121212',
            color: 'white',
          }}
        >
          {/* <button onClick={toggleBoundScale}>{'+/-'}</button> */}
          {/* <button onClick={toggleBoundOffset}>{'<->'}</button> */}
        </div>
      )}
    </div>
  )
}

export default Layout

// /** @jsxImportSource @emotion/react */
// import { FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
// import { find, map, difference, uniqueId, noop, isNull, cloneDeep, sortBy } from 'lodash'
// import { useSnapshot } from 'valtio'

// import proxyState from '../../store'

// import Viewport, { TViewport, TViewportPosition } from './layout/Viewport'

// // Expected results: '' | '0' | '12' | '146' | '235' | '3456'
// const getLayoutSnapshot = (viewports: TViewport[]) => {
//   return map(viewports, 'position').sort().join('')
// }

// const layoutSnapshotMapping: {
//   [layoutSnapshot: string]: {
//     add: () => (null | TViewportPosition)[][]
//     remove: (position: TViewportPosition) => TViewportPosition[][]
//   }
// } = {
//   '': {
//     add: () => [[null, 0]],
//     remove: () => {
//       throw new Error('Invalid operation')
//     },
//   },
//   '0': {
//     add: () => [
//       [0, 1],
//       [null, 2],
//     ],
//     remove: (position) => {
//       if (position === 0) return []
//       throw new Error('Invalid position')
//     },
//   },
//   '12': {
//     add: () => [
//       [2, 2],
//       [1, 3],
//       [null, 5],
//     ],
//     remove: (position) => {
//       if (position === 1) return [[2, 0]]
//       if (position === 2) return [[1, 0]]
//       throw new Error('Invalid position')
//     },
//   },
//   '146': {
//     add: () => [
//       [1, 3],
//       [4, 4],
//       [null, 5],
//       [6, 6],
//     ],
//     remove: (position) => {
//       if (position === 1)
//         return [
//           [4, 1],
//           [6, 2],
//         ]
//       if (position === 4)
//         return [
//           [1, 1],
//           [6, 2],
//         ]
//       if (position === 6)
//         return [
//           [1, 1],
//           [4, 2],
//         ]
//       throw new Error('Invalid position')
//     },
//   },
//   '235': {
//     add: () => [
//       [3, 3],
//       [2, 4],
//       [5, 5],
//       [null, 6],
//     ],
//     remove: (position) => {
//       if (position === 2)
//         return [
//           [3, 1],
//           [5, 2],
//         ]
//       if (position === 3)
//         return [
//           [5, 1],
//           [2, 2],
//         ]
//       if (position === 5)
//         return [
//           [3, 1],
//           [2, 2],
//         ]
//       throw new Error('Invalid position')
//     },
//   },
//   '3456': {
//     add: () => {
//       throw new Error('Invalid operation')
//     },
//     remove: (position) => {
//       if (position === 3)
//         return [
//           [5, 1],
//           [4, 4],
//           [6, 6],
//         ]
//       if (position === 4)
//         return [
//           [6, 2],
//           [3, 3],
//           [5, 5],
//         ]
//       if (position === 5)
//         return [
//           [3, 1],
//           [4, 4],
//           [6, 6],
//         ]
//       if (position === 6)
//         return [
//           [4, 2],
//           [3, 3],
//           [5, 5],
//         ]
//       throw new Error('Invalid position')
//     },
//   },
// }

// const Layout: FC = () => {
//   const state = useSnapshot(proxyState)

//   const [viewports, setViewports] = useState<TViewport[]>([])

//   // const switchLevel = useCallback((viewportId: string, levelId: number) => {
//   //   setLayout((layout) => {
//   //     const viewport = find(layout, ['view.id', viewportId])
//   //     if (!viewport) throw new Error('Viewport not found.')
//   //     const updatedViewport = switchViewportLevel(viewport, levelId)
//   //     const swapper = find(layout, ['view.level', levelId])
//   //     const updatedSwapper = swapper && switchViewportLevel(swapper, viewport.view.levelId)
//   //     const updatedLayout = layout.map((viewport) => {
//   //       return viewport.id === updatedViewport.id
//   //         ? updatedViewport
//   //         : viewport.id === updatedSwapper?.id
//   //         ? updatedSwapper
//   //         : viewport
//   //     })
//   //     proxyState.levels = map(updatedLayout, 'view.level')
//   //     return updatedLayout
//   //   })
//   // }, [])

//   const layoutElementRef = useRef<HTMLDivElement | null>(null)
//   const [size, setSize] = useState({ width: 0, height: 0 })

//   useLayoutEffect(() => {
//     const setLayoutSize = () => {
//       const layoutElement = layoutElementRef.current
//       if (!layoutElement) throw new Error()
//       const { width, height } = layoutElement.getBoundingClientRect()
//       setSize({ width, height })
//       proxyState.layout.size = [width, height]
//     }
//     setLayoutSize()
//     document.addEventListener('DOMContentLoaded', setLayoutSize)
//     window.addEventListener('resize', setLayoutSize)
//     return () => {
//       document.removeEventListener('DOMContentLoaded', setLayoutSize)
//       window.removeEventListener('resize', setLayoutSize)
//     }
//   }, [setSize])

//   const viewportPositionPropsMapping: {
//     [position in TViewportPosition]: { width: number; height: number; x: number; y: number }
//   } = useMemo(() => {
//     const { width, height } = size
//     return {
//       0: { width, height, x: 0, y: 0 },
//       1: { width: width / 2, height, x: 0, y: 0 },
//       2: { width: width / 2, height, x: width / 2, y: 0 },
//       3: { width: width / 2, height: height / 2, x: 0, y: 0 },
//       4: { width: width / 2, height: height / 2, x: width / 2, y: 0 },
//       5: { width: width / 2, height: height / 2, x: 0, y: height / 2 },
//       6: { width: width / 2, height: height / 2, x: width / 2, y: height / 2 },
//     }
//   }, [size])

//   // const createViewport = useCallback(
//   //   (levelId: number, position: TViewportPosition): TViewport => {
//   //     return { id: uniqueId(), levelId, position, ...viewportPositionPropsMapping[position] }
//   //   },
//   //   [viewportPositionPropsMapping]
//   // )

//   // const updateViewportPosition = useCallback(
//   //   (viewport: TViewport, position: TViewportPosition) => {
//   //     return { ...viewport, position, ...viewportPositionPropsMapping[position] }
//   //   },
//   //   [viewportPositionPropsMapping]
//   // )

//   useEffect(() => {
//     setViewports((viewports) => {
//       const levels = map(viewports, 'levelId')
//       const removedLevels = difference(levels, state.levels)
//       const addedLevels = difference(state.levels, levels)
//       // console.log(
//       //   `viewports: ${levels.join()}, state: ${state.levels.join()}  (+ ${addedLevels.join()} | - ${removedLevels.join()})`
//       // )

//       const update1 = removedLevels.reduce((acc, levelId) => {
//         const viewport = find(acc, { levelId })
//         if (!viewport) throw new Error()
//         const remove = layoutSnapshotMapping[getLayoutSnapshot(acc)].remove
//         return remove(viewport.position).map(([from, to]) => {
//           const viewportOnPosition = find(acc, { position: from })
//           if (!viewportOnPosition) throw new Error()
//           // return updateViewportPosition(viewportOnPosition, to)
//           return { ...viewportOnPosition, position: to, ...viewportPositionPropsMapping[to] }
//         })
//       }, viewports)

//       const update2 = addedLevels.reduce((acc, levelId) => {
//         const add = layoutSnapshotMapping[getLayoutSnapshot(acc)].add
//         return add().map(([from, to]) => {
//           if (isNull(to)) throw new Error()
//           if (isNull(from)) {
//             return {
//               id: uniqueId(),
//               levelId,
//               position: to,
//               ...viewportPositionPropsMapping[to],
//             }
//           }
//           // if (isNull(from)) return createViewport(levelId, to)
//           const viewportOnPosition = find(acc, { position: from })
//           if (!viewportOnPosition) throw new Error()
//           // return updateViewportPosition(viewportOnPosition, to)
//           return { ...viewportOnPosition, position: to, ...viewportPositionPropsMapping[to] }
//         })
//       }, update1)

//       // const r = [...update2, createViewport(1, 2)]
//       // const r = cloneDeep(update2)
//       // const r = [createViewport(1, 0)]
//       // console.log('setViewport', viewports, r, map(r, 'id'))
//       return sortBy(update2, ['id'])
//     })
//   }, [state.levels, viewportPositionPropsMapping])
//   // }, [state.levels, size, createViewport, updateViewportPosition])

//   useEffect(() => {
//     setViewports((viewports) => {
//       return viewports.map((viewport) => {
//         return { ...viewport, ...viewportPositionPropsMapping[viewport.position] }
//       })
//     })
//   }, [viewportPositionPropsMapping])

//   useLayoutEffect(() => {
//     proxyState.levels = state.map?.levels.slice(0, 4) || []
//   }, [state.map])

//   return (
//     <div
//       ref={layoutElementRef}
//       css={{ width: `calc(100% - 300px)`, height: '100%', position: 'absolute', top: 0, left: 300 }}
//     >
//       {viewports.map((viewport) => (
//         <Viewport key={viewport.id} {...viewport} onLevelSwitch={noop} />
//       ))}
//     </div>
//   )
// }

// export default Layout
