/** @jsxImportSource @emotion/react */
import { FC, useMemo } from 'react'
import { a, useSpring } from '@react-spring/web'
import { getLevelById } from '../../database'

import Level from './Level'
import { noop } from 'lodash'

export type TViewportProps = {
  id: string
  width: number
  height: number
  left: number
  top: number
  levelId: string
  onLevelChange: (id: string, levelId: string) => void
  onClose: (id: string) => void
}

const Viewport: FC<TViewportProps> = ({
  id,
  width,
  height,
  left,
  top,
  levelId,
  onLevelChange,
  onClose,
}) => {
  const levelData = useMemo(() => getLevelById(levelId), [levelId])

  const { scale, offset } = useSpring({ scale: 1, offset: [0.5, 0.5] })

  const levelProps = useMemo(() => {
    // Setting base level size (1x scale) using blueprint's aspect ratio
    // so that the level would match (cover) the viewport
    const { width: bpWidth, height: bpHeight } = levelData.blueprint
    const blueprintAR = bpWidth / bpHeight
    const viewportAR = width / height
    const arScale = viewportAR < blueprintAR ? height / bpHeight : width / bpWidth
    return {
      id: levelId,
      width: bpWidth * arScale,
      height: bpHeight * arScale,
      left: width / 2,
      top: height / 2,
      scale,
      offset,
      onMouseDown: noop,
    }
  }, [width, height, levelId, levelData.blueprint, scale, offset])

  return (
    <a.div
      css={{ position: 'absolute', overflow: 'hidden', border: '1px solid blue' }}
      style={{ width, height, left, top }}
      // {...handleWheel()}
      // {...handleDrag()}
    >
      <Level {...levelProps} />
      {/* <LevelSelector onLevelChange={} /> */}
      {/* <Close onCLick={} /> */}
    </a.div>
  )
}

export default Viewport
// /** @jsxImportSource @emotion/react */
// import {
//   FC,
//   useCallback,
//   useEffect,
//   useLayoutEffect,
//   useMemo,
//   useRef,
//   useState,
//   MouseEventHandler,
//   ChangeEventHandler,
// } from 'react'
// import { uniqueId, clamp } from 'lodash'
// import { useSnapshot, subscribe } from 'valtio'
// import { useDrag, useWheel } from 'react-use-gesture'
// import { a, useSpring, to, SpringValue, Interpolation } from '@react-spring/web'

// import { getLevelById, TLevelData } from '../../../database'
// import proxyState, {
//   isBoundViewOffsetTarget,
//   isBoundViewOffsetEnabled,
//   isBoundViewScaleEnabled,
//   setBoundViewOffset,
//   setBoundViewScale,
//   getBoundViewOffset,
//   isBoundViewScaleTarget,
//   getBoundViewScale,
// } from '../../../store'

// import Level from './view/Level'

// export type TViewportPosition =
//   | 0 // full space
//   | 1 // left half
//   | 2 // right half
//   | 3 // left-top quadrant
//   | 4 // right-top quadrant
//   | 5 // left-bottom quadrant
//   | 6 // right-bottom quadrant

// export type TViewport = {
//   id: string
//   levelId: number
//   position: TViewportPosition
//   width: number
//   height: number
//   x: number
//   y: number
// }

// export type TLevel = TLevelData & {
//   baseWidth: number
//   baseHeight: number
//   scale: SpringValue<number>
//   offset: SpringValue<number[]>
//   // width: Interpolation<number, number>
//   // height: Interpolation<number, number>
//   getWidth: () => number
//   getHeight: () => number
// }

// const SCALE_RATE = 0.003
// const SCALE_LIMIT = 4

// // section #########################################################################################
// //  THE COMPONENT
// // #################################################################################################

// const Viewport: FC<
//   TViewport & { onLevelSwitch: (viewportId: string, levelId: number) => void }
// > = ({ onLevelSwitch, children, ...restProps }) => {
//   const viewport: TViewport = useMemo(() => restProps, [restProps])
//   const state = useSnapshot(proxyState)

//   const [spring] = useSpring(
//     {
//       scale: 1,
//       offset: [0.5, 0.5],
//       config: { tension: 1000, friction: 66.6 },
//     },
//     []
//   )

//   const level: TLevel = useMemo(() => {
//     // Setting base level size (1x scale) using blueprint's aspect ratio
//     // so that the level would match (cover) the viewport
//     const levelData = getLevelById(viewport.levelId)
//     const bpWidth = levelData.blueprint.width
//     const bpHeight = levelData.blueprint.height
//     const bpAR = bpWidth / bpHeight
//     const viewportAR = viewport.width / viewport.height
//     const baseScale = viewportAR < bpAR ? viewport.height / bpHeight : viewport.width / bpWidth
//     const baseWidth = bpWidth * baseScale
//     const baseHeight = bpHeight * baseScale
//     return {
//       ...levelData,
//       scale: spring.scale,
//       offset: spring.offset,
//       baseWidth,
//       baseHeight,
//       // todo: understand why this is not working as expected: level.width.get() not updating
//       // width: to(spring.scale, (scale) => baseWidth * scale),
//       // height: to(spring.scale, (scale) => baseHeight * scale),
//       getWidth: () => baseWidth * spring.scale.get(),
//       getHeight: () => baseHeight * spring.scale.get(),
//     }
//   }, [viewport, spring])

//   // part ================================
//   //  EVENT HANDLERS & WATCHERS
//   // =====================================

//   const clampOffset = useCallback(
//     (offset: number[], scale: number) => {
//       const levelWidth = level.baseWidth * scale
//       const levelHeight = level.baseHeight * scale
//       const xMin = viewport.width / 2 / levelWidth
//       const xMax = (levelWidth - viewport.width / 2) / levelWidth
//       const yMin = viewport.height / 2 / levelHeight
//       const yMax = (levelHeight - viewport.height / 2) / levelHeight
//       const [x, y] = offset
//       return [clamp(x, xMin, xMax), clamp(y, yMin, yMax)]
//     },
//     [viewport.width, viewport.height, level]
//   )

//   const onViewWheel = useWheel(
//     ({ movement: [_, wheelY] }) => {
//       const scale = 1 + -wheelY * SCALE_RATE
//       level.scale.start({ to: scale })
//       setBoundViewScale(viewport.id, scale)
//       // todo: why i'm clamping if there are bounds? check if rubberband works
//       const offset = clampOffset(level.offset.get(), scale)
//       level.offset.start({ to: offset })
//       setBoundViewOffset(viewport.id, offset)
//     },
//     {
//       initial: () => [0, -(level.scale.get() - 1) / SCALE_RATE],
//       bounds: { top: -(SCALE_LIMIT / SCALE_RATE), bottom: 0 },
//     }
//   )

//   // piece -------------------------------
//   //  Bound options watchers

//   useEffect(() => {
//     const handleBoundOffset = () => {
//       if (!isBoundViewOffsetEnabled() || isBoundViewOffsetTarget(viewport.id)) return
//       level.offset.start({ to: clampOffset(getBoundViewOffset(), level.scale.get()) })
//     }

//     const handleBoundScale = () => {
//       if (!isBoundViewScaleEnabled() || isBoundViewScaleTarget(viewport.id)) return
//       level.scale.start({ to: getBoundViewScale() })
//       level.offset.start({ to: clampOffset(level.offset.get(), getBoundViewScale()) })
//     }

//     const unsubBoundOffset = subscribe(proxyState.layout.boundViewOffset, handleBoundOffset)
//     const unsubBoundScale = subscribe(proxyState.layout.boundViewScale, handleBoundScale)

//     return () => {
//       unsubBoundOffset()
//       unsubBoundScale()
//     }
//   }, [viewport.id, level.scale, level.offset, clampOffset])

//   // part ================================
//   //  LEVEL SELECTOR
//   // =====================================

//   const onLevelSelectorChange: ChangeEventHandler<HTMLSelectElement> = useCallback(
//     (event) => onLevelSwitch(viewport.id, +event.target.value),
//     [onLevelSwitch, viewport.id]
//   )

//   const levelSelectorJSX = useMemo(
//     () => (
//       <select
//         value={level.id}
//         onChange={onLevelSelectorChange}
//         css={{ position: 'absolute', top: 0, left: 0 }}
//       >
//         {state.map?.levels.map((item) => {
//           const { id, type } = getLevelById(item)
//           return (
//             <option key={id} value={id}>
//               {type}
//             </option>
//           )
//         })}
//       </select>
//     ),
//     [level.id, state.map, onLevelSelectorChange]
//   )

//   // part ================================
//   //  RENDERER
//   // =====================================

//   // todo: state 'objects' -- pins, rooms, cameras...
//   // todo: 'close' button
//   // todo: useTransition

//   return (
//     <a.div
//       css={{
//         width: viewport.width,
//         height: viewport.height,
//         position: 'absolute',
//         left: viewport.x,
//         top: viewport.y,
//         overflow: 'hidden',
//         border: '1px solid blue',
//         transition: 'all .3s', // todo: width, height, x, y -> spring
//       }}
//       {...onViewWheel()}
//     >
//       <Level {...level} viewport={viewport} clampOffset={clampOffset} />
//       {levelSelectorJSX}
//       <div css={{ position: 'absolute', left: 0, bottom: 0, background: 'white' }}>
//         {viewport.id}
//       </div>
//     </a.div>
//   )
// }

// export default Viewport
