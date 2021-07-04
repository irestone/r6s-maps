/** @jsxImportSource @emotion/react */
import { SpringValue, to, useSpring } from '@react-spring/core'
import { a } from '@react-spring/web'
import { clamp } from 'lodash'
import { FC, useCallback, useEffect, useLayoutEffect, useMemo } from 'react'
import { useDrag, useWheel } from 'react-use-gesture'
import { getLevelById } from '../../database'
import Level from './viewport/Level'

type TViewportStatus = 'closed' | 'opened'
type TViewportVariant = 'thumb' | 'minimized' | 'quadrant' | 'half' | 'full'

type TViewportProps = {
  id: string
  levelId: string
  status: TViewportStatus
  variant: TViewportVariant
  position: number
  width: SpringValue<number>
  height: SpringValue<number>
  x: SpringValue<number>
  y: SpringValue<number>
  onOpen: (id: string) => void
  onClose: (id: string) => void
}

const SCALE_RATE = 0.003
const SCALE_LIMIT = 4

const Viewport: FC<TViewportProps> = ({
  id,
  levelId,
  status,
  variant,
  width,
  height,
  x,
  y,
  onOpen,
  onClose,
}) => {
  const handleClose = useCallback(() => onClose(id), [onClose, id])
  const handleOpen = useCallback(() => onOpen(id), [onOpen, id])
  const handleClick = useCallback(() => {
    if (status === 'closed') return handleOpen()
  }, [status, handleOpen])

  const [{ scale, offset }] = useSpring(
    {
      scale: 1,
      offset: [-0.5, -0.5],
      config: { tension: 1000, friction: 60 },
    },
    []
  )

  const levelData = getLevelById(levelId)

  // todo(fix): recalculate (clamp) offset on size change
  // find a way to subscribe on viewport size changes
  useEffect(() => {
    const w = width.animation.to
    const h = height.animation.to
    console.log(`${id}: ${w}x${h}`)
  }, [id, width.animation.to, height.animation.to])

  const levelProps = useMemo(() => {
    // Setting base level size (1x scale) using blueprint's aspect ratio
    // so that the level would match (cover) the viewport
    const bpWidth = levelData.blueprint.width
    const bpHeight = levelData.blueprint.height
    const bpAR = bpWidth / bpHeight
    const ARScale = to([width, height], (w, h) => (w / h < bpAR ? h / bpHeight : w / bpWidth))
    return {
      id: levelId,
      width: to(ARScale, (s) => bpWidth * s),
      height: to(ARScale, (s) => bpHeight * s),
      left: to(width, (w) => w / 2),
      top: to(height, (h) => h / 2),
      scale,
      offset,
      getScaledWidth: () => {
        const w = width.get()
        const h = height.get()
        const s = w / h < bpAR ? h / bpHeight : w / bpWidth
        return bpWidth * s
      },
      getScaledHeight: () => {
        const w = width.get()
        const h = height.get()
        const s = w / h < bpAR ? h / bpHeight : w / bpWidth
        return bpHeight * s
      },
    }
  }, [levelId, width, height, levelData.blueprint.width, levelData.blueprint.height, scale, offset])

  const clampOffset = useCallback(
    (offset: number[], scale: number) => {
      const lw = levelProps.getScaledWidth()
      const lh = levelProps.getScaledHeight()
      const xMin = (-lw + width.get() / 2) / lw
      const xMax = -width / 2 / lw
      const yMin = (-lh + height.get() / 2) / lh
      const yMax = -height / 2 / lh
      const [x, y] = offset
      return [clamp(x, xMin, xMax), clamp(y, yMin, yMax)]
    },
    [width, height, levelProps]
  )

  const onWheel = useWheel(
    ({ movement: [_, wheelY], last }) => {
      const s = 1 + -wheelY * SCALE_RATE
      scale.start({ to: s })
      // setBoundViewScale(viewport.id, s)
      if (last) {
        const off = clampOffset(offset.get(), s)
        offset.start({ to: off })
        // todo(fix): offset leaves gaps when zoom out near the edges
        // setBoundViewOffset(viewport.id, offset)
      }
    },
    {
      initial: () => [0, -(scale.get() - 1) / SCALE_RATE],
      bounds: { top: -(SCALE_LIMIT / SCALE_RATE), bottom: 0 },
    }
  )

  const onDrag = useDrag(
    ({ movement: [x, y] }) => {
      const off = [x / levelProps.getScaledWidth(), y / levelProps.getScaledHeight()]
      offset.start({ to: off })
      // setBoundViewOffset(viewport.id, offset)
    },
    {
      initial: () => {
        const [x, y] = offset.get()
        return [x * levelProps.getScaledWidth(), y * levelProps.getScaledHeight()]
      },
      bounds: () => ({
        left: -levelProps.getScaledWidth() + width.get() / 2,
        right: -width / 2,
        top: -levelProps.getScaledHeight() + height.get() / 2,
        bottom: -height / 2,
      }),
      // rubberband: true,
    }
  )

  return (
    <a.div css={{ position: 'absolute', overflow: 'hidden' }} style={{ width, height, x, y }}>
      <div
        css={{
          width: '100%',
          height: '100%',
          // background:
          //   'url("https://www.toptal.com/designers/subtlepatterns/patterns/skewed_print.png")',
          background: '#2f2f2f',
          borderRadius: 3,
          color: 'white',
          border: '1px solid #353535',
          overflow: 'hidden',
          boxShadow: 'rgb(0 0 0 / 35%) 0px 0px 50px inset',
          position: 'relative',
        }}
        onClick={handleClick}
        {...onWheel()}
        {...onDrag()}
      >
        <Level {...levelProps} />
        {status === 'opened' && (
          <>
            <button
              onClick={handleClose}
              css={{
                padding: '3px 6px',
                position: 'absolute',
                top: 0,
                right: 0,
                background: '#353535',
                outline: 0,
                border: 0,
                borderLeft: '1px solid #353535',
                borderBottom: '1px solid #353535',
                color: 'white',
                cursor: 'pointer',
                borderRadius: '0 0 0 3px',
              }}
            >
              —
            </button>
          </>
        )}
        <span
          style={{
            display: 'inline-block',
            width: 120,
            padding: 2,
            // background: '#353535',
            background:
              'linear-gradient(0deg, rgba(53,53,53,1) 0%, rgba(60,60,60,1) 51%, rgba(53,53,53,1) 100%)',
            borderRight: '1px solid #353535',
            borderBottom: '1px solid #353535',
            borderRadius: '0 0 3px 0',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >{`${levelData.type}`}</span>
        <div
          css={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            background: 'white',
            color: 'black',
            padding: 5,
          }}
        >
          {id}
        </div>
      </div>
    </a.div>
  )
}

export type { TViewportProps, TViewportStatus, TViewportVariant }
export default Viewport

// /** @jsxImportSource @emotion/react */
// import { SpringValue, to, useSpring } from '@react-spring/core'
// import { a } from '@react-spring/web'
// import { clamp } from 'lodash'
// import { FC, useCallback, useMemo } from 'react'
// import { useDrag, useWheel } from 'react-use-gesture'
// import { getLevelById } from '../../database'
// import Level from './viewport/Level'

// type TViewportStatus = 'closed' | 'opened'
// type TViewportVariant = 'thumb' | 'minimized' | 'quadrant' | 'half' | 'full'

// type TViewportProps = {
//   id: string
//   levelId: string
//   status: TViewportStatus
//   variant: TViewportVariant
//   position: number
//   width: SpringValue<number>
//   height: SpringValue<number>
//   x: SpringValue<number>
//   y: SpringValue<number>
//   onOpen: (id: string) => void
//   onClose: (id: string) => void
// }

// const SCALE_RATE = 0.003
// const SCALE_LIMIT = 4

// const Viewport: FC<TViewportProps> = ({
//   id,
//   levelId,
//   status,
//   variant,
//   width,
//   height,
//   x,
//   y,
//   onOpen,
//   onClose,
// }) => {
//   const handleClose = useCallback(() => onClose(id), [onClose, id])
//   const handleOpen = useCallback(() => onOpen(id), [onOpen, id])
//   const handleClick = useCallback(() => {
//     if (status === 'closed') return handleOpen()
//   }, [status, handleOpen])

//   const [{ scale, offset }] = useSpring(
//     {
//       scale: 1,
//       offset: [-0.5, -0.5],
//       config: { tension: 1000, friction: 60 },
//     },
//     []
//   )

//   // todo: recalculate (clamp) offset on size change

//   const levelData = getLevelById(levelId)

//   const [levelSpring] = useSpring(() => {
//     // Setting base level size (1x scale) using blueprint's aspect ratio
//     // so that the level would match (cover) the viewport
//     const { width: bpWidth, height: bpHeight } = levelData.blueprint
//     const blueprintAR = bpWidth / bpHeight
//     const viewportAR = width / height
//     const arScale = viewportAR < blueprintAR ? height / bpHeight : width / bpWidth
//     return {
//       width: bpWidth * arScale,
//       height: bpHeight * arScale,
//       left: width / 2,
//       top: height / 2,
//       config: { tension: 1000, friction: 60 },
//     }
//   }, [width, height, levelData.blueprint.width, levelData.blueprint.height])

//   const levelProps = useMemo(() => {
//     return {
//       id: levelId,
//       ...levelSpring,
//       scale,
//       offset,
//       getScaledWidth: () => levelSpring.width.get() * scale.get(),
//       getScaledHeight: () => levelSpring.height.get() * scale.get(),
//     }
//   }, [levelId, levelSpring, scale, offset])

//   const clampOffset = useCallback(
//     (offset: number[], scale: number) => {
//       const lw = levelProps.getScaledWidth()
//       const lh = levelProps.getScaledHeight()
//       const xMin = (-lw + width / 2) / lw
//       const xMax = -width / 2 / lw
//       const yMin = (-lh + height / 2) / lh
//       const yMax = -height / 2 / lh
//       const [x, y] = offset
//       return [clamp(x, xMin, xMax), clamp(y, yMin, yMax)]
//     },
//     [width, height, levelProps]
//   )

//   const onWheel = useWheel(
//     ({ movement: [_, wheelY], last }) => {
//       const s = 1 + -wheelY * SCALE_RATE
//       scale.start({ to: s })
//       // setBoundViewScale(viewport.id, s)
//       if (last) {
//         const off = clampOffset(offset.get(), s)
//         offset.start({ to: off })
//         // todo(fix): offset leaves gaps when zoom out near the edges
//         // setBoundViewOffset(viewport.id, offset)
//       }
//     },
//     {
//       initial: () => [0, -(scale.get() - 1) / SCALE_RATE],
//       bounds: { top: -(SCALE_LIMIT / SCALE_RATE), bottom: 0 },
//     }
//   )

//   const onDrag = useDrag(
//     ({ movement: [x, y] }) => {
//       const off = [x / levelProps.getScaledWidth(), y / levelProps.getScaledHeight()]
//       offset.start({ to: off })
//       // setBoundViewOffset(viewport.id, offset)
//     },
//     {
//       initial: () => {
//         const [x, y] = offset.get()
//         return [x * levelProps.getScaledWidth(), y * levelProps.getScaledHeight()]
//       },
//       bounds: () => ({
//         left: -levelProps.getScaledWidth() + width / 2,
//         right: -width / 2,
//         top: -levelProps.getScaledHeight() + height / 2,
//         bottom: -height / 2,
//       }),
//       // rubberband: true,
//     }
//   )

//   return (
//     <div
//       style={{
//         width,
//         height,
//         position: 'absolute',
//         left,
//         top,
//         padding: 2,
//         transition: 'all .3s',
//         overflow: 'hidden',
//       }}
//     >
//       <div
//         css={{
//           width: '100%',
//           height: '100%',
//           // background:
//           //   'url("https://www.toptal.com/designers/subtlepatterns/patterns/skewed_print.png")',
//           background: '#2f2f2f',
//           borderRadius: 3,
//           color: 'white',
//           border: '1px solid #353535',
//           overflow: 'hidden',
//           boxShadow: 'rgb(0 0 0 / 35%) 0px 0px 50px inset',
//           position: 'relative',
//         }}
//         onClick={handleClick}
//         {...onWheel()}
//         {...onDrag()}
//       >
//         <Level {...levelProps} />
//         {status === 'opened' && (
//           <>
//             <button
//               onClick={handleClose}
//               css={{
//                 padding: '3px 6px',
//                 position: 'absolute',
//                 top: 0,
//                 right: 0,
//                 background: '#353535',
//                 outline: 0,
//                 border: 0,
//                 borderLeft: '1px solid #353535',
//                 borderBottom: '1px solid #353535',
//                 color: 'white',
//                 cursor: 'pointer',
//                 borderRadius: '0 0 0 3px',
//               }}
//             >
//               —
//             </button>
//           </>
//         )}
//         <span
//           style={{
//             display: 'inline-block',
//             width: 120,
//             padding: 2,
//             // background: '#353535',
//             background:
//               'linear-gradient(0deg, rgba(53,53,53,1) 0%, rgba(60,60,60,1) 51%, rgba(53,53,53,1) 100%)',
//             borderRight: '1px solid #353535',
//             borderBottom: '1px solid #353535',
//             borderRadius: '0 0 3px 0',
//             position: 'absolute',
//             top: 0,
//             left: 0,
//           }}
//         >{`${levelData.type}`}</span>
//         <a.div css={{ position: 'absolute', bottom: 0, left: 0 }}>
//           {to(springValue, (v) => v)}
//         </a.div>
//       </div>
//     </div>
//   )
// }

// export type { TViewportProps, TViewportStatus, TViewportVariant }
// export default Viewport
