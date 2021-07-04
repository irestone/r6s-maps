/** @jsxImportSource @emotion/react */
import { FC, useCallback, useMemo, MouseEventHandler } from 'react'
import { a, to, SpringValue } from '@react-spring/web'
import { getLevelById } from '../../database'

const Level: FC<{
  id: string
  width: number
  height: number
  left: number
  top: number
  scale: SpringValue<number>
  offset: SpringValue<number[]>
  onMouseDown: (id: string, event: React.MouseEvent<SVGSVGElement, MouseEvent>) => void
}> = ({ id, width, height, left, top, scale, offset, onMouseDown, children }) => {
  const { type, blueprint } = useMemo(() => getLevelById(id), [id])

  const transform = useMemo(() => {
    return to([scale, offset] as any, (s, [x, y]) => `translate(${x}px, ${y}px) scale(${s})`)
  }, [scale, offset])

  const transformOrigin = useMemo(() => {
    return to([offset], ([x, y]) => `${-x}px ${-y}px`)
  }, [offset])

  const viewBox = useMemo(() => {
    return to([scale], (s) => `0 0 ${width * s} ${height * s}`)
  }, [width, height, scale])

  const handleMouseDown: MouseEventHandler<SVGSVGElement> = useCallback(
    (event) => {
      if (event.target === event.currentTarget && event.button === 0) onMouseDown(id, event)
    },
    [onMouseDown, id]
  )

  return (
    <a.div
      style={{
        width,
        height,
        position: 'absolute',
        left,
        top,
        transform,
        transformOrigin,
        userSelect: 'none',
      }}
    >
      <a.svg
        viewBox={viewBox}
        onMouseDown={handleMouseDown}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      >
        {/* {areas, cameras...} */}
        {/* {pins} */}
      </a.svg>
      <img
        src={blueprint.src}
        alt={type}
        draggable={false}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </a.div>
  )
}

export default Level
// /** @jsxImportSource @emotion/react */
// import { FC, useCallback, useMemo, useRef, MouseEventHandler, useEffect } from 'react'
// import { find } from 'lodash'
// import { useSnapshot } from 'valtio'
// import { useDrag } from 'react-use-gesture'
// import { a, useSpring, to, SpringValue } from '@react-spring/web'

// import proxyState, { addPin, setBoundViewOffset, removePin } from '../../../../store'
// import { TViewport, TLevel } from '../Viewport'
// import Pin from './Pin'

// type TLevelProps = {
//   width: SpringValue<number>
//   height: SpringValue<number>
//   left: SpringValue<number>
//   top: SpringValue<number>
//   scale: SpringValue<number>
//   offset: SpringValue<number>
// }

// const Level: FC<
//   TLevel & { viewport: TViewport; clampOffset: (offset: number[], scale: number) => number[] }
// > = ({ viewport, clampOffset, children, ...restProps }) => {
//   // todo(fix): this will cause re-render
//   const level: TLevel = restProps
//   console.log(level.baseWidth, level.baseHeight, viewport.width, viewport.height)

//   // doesn't correctly work w/ deps for some reason (initial values are not changing on load)
//   const spring = useSpring({
//     width: level.baseWidth,
//     height: level.baseHeight,
//     left: viewport.width / 2,
//     top: viewport.height / 2,
//     config: { tension: 800, friction: 66.6 },
//   })

//   const transform = useMemo(() => {
//     return to(
//       [spring.width, spring.height, level.scale, level.offset] as any,
//       (width, height, scale, [offX, offY]) => {
//         return `translate(${-offX * width}px, ${-offY * height}px) scale(${scale})`
//       }
//     )
//   }, [spring, level.scale, level.offset])

//   const transformOrigin = useMemo(() => {
//     return to([spring.width, spring.height, level.offset] as any, (width, height, [offX, offY]) => {
//       return `${offX * width}px ${offY * height}px`
//     })
//   }, [spring, level.offset])

//   const viewBox = useMemo(() => {
//     return to([spring.width, spring.height, level.scale] as any, (width, height, scale) => {
//       return `0 0 ${width * scale} ${height * scale}`
//     })
//   }, [spring, level.scale])

//   const levelElementRef = useRef<HTMLDivElement | null>(null)

//   const onMouseDown: MouseEventHandler<SVGSVGElement> = useCallback(
//     ({ target, currentTarget, clientX, clientY, button }) => {
//       if (target !== currentTarget || button !== 0) return

//       levelElementRef.current?.addEventListener('mousemove', onMouseMove)
//       levelElementRef.current?.addEventListener('mouseup', onMouseUp)

//       function onMouseMove() {
//         levelElementRef.current?.removeEventListener('mousemove', onMouseMove)
//         levelElementRef.current?.removeEventListener('mouseup', onMouseUp)
//       }

//       function onMouseUp() {
//         const levelBCR = currentTarget.getBoundingClientRect()
//         const x = (clientX - levelBCR.x) / levelBCR.width
//         const y = (clientY - levelBCR.y) / levelBCR.height
//         addPin(x, y)
//         levelElementRef.current?.removeEventListener('mousemove', onMouseMove)
//         levelElementRef.current?.removeEventListener('mouseup', onMouseUp)
//       }
//     },
//     []
//   )

//   const onDrag = useDrag(
//     ({ movement: [x, y] }) => {
//       const offset = [-x / level.getWidth(), -y / level.getHeight()]
//       level.offset.start({ to: offset })
//       setBoundViewOffset(viewport.id, offset)
//     },
//     {
//       initial: () => {
//         const [x, y] = level.offset.get()
//         return [-x * level.getWidth(), -y * level.getHeight()]
//       },
//       bounds: () => ({
//         left: -(level.getWidth() - viewport.width / 2),
//         right: -(viewport.width / 2),
//         top: -(level.getHeight() - viewport.height / 2),
//         bottom: -(viewport.height / 2),
//       }),
//       // rubberband: true,
//     }
//   )

//   // todo: pins, areas (rooms), cameras and other objects -> level's children
//   // don't forget to remove clampOffset from props then

//   const state = useSnapshot(proxyState)

//   const centerPin = useCallback(
//     (id: string) => {
//       const pin = find(state.layout.pins, { id })
//       if (!pin) throw new Error()
//       const offset = clampOffset([pin.x, pin.y], level.scale.get())
//       level.offset.start({ to: offset })
//       setBoundViewOffset(viewport.id, offset)
//     },
//     [state.layout.pins, level.offset, level.scale, clampOffset, viewport.id]
//   )

//   return (
//     <a.div
//       ref={levelElementRef}
//       css={{ position: 'absolute', userSelect: 'none' }}
//       style={{ ...spring, transform, transformOrigin }}
//       {...onDrag()}
//     >
//       <a.svg
//         css={{ position: 'absolute', width: '100%', height: '100%' }}
//         viewBox={viewBox}
//         onMouseDown={onMouseDown}
//       >
//         {state.layout.pins.map((pin) => (
//           <Pin
//             key={pin.id}
//             {...pin}
//             viewport={viewport}
//             level={level}
//             onRemove={removePin}
//             onCenter={centerPin}
//           />
//         ))}
//       </a.svg>
//       <img
//         src={level.blueprint.src}
//         alt={level.type}
//         css={{ display: 'block', width: '100%', height: '100%' }}
//         draggable={false}
//       />
//     </a.div>
//   )
// }

// export default Level
