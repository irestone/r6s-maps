/** @jsxImportSource @emotion/react */
import { FC, useCallback } from 'react'
import { a, SpringValue, to } from '@react-spring/web'

const Pin: FC<{
  id: string
  variant: 'standard' | 'directed'
  label: string
  x: SpringValue<number>
  y: SpringValue<number>
  direction: SpringValue<number>
  onClick: (id: string) => void
}> = ({ id, variant, x, y, direction, label, onClick }) => {
  const handleClick = useCallback(() => onClick(id), [onClick, id])
  return (
    <a.g
      onClick={handleClick}
      css={{ cursor: 'pointer' }}
      transform={to([x, y], (x, y) => `translate(${x}, ${y})`)}
    >
      <circle r={8} fill="green" stroke="white" strokeWidth="2" />
      <text x={-3.3} y={4.2} fontSize={12} fill="white">
        {label}
      </text>
      {variant === 'directed' && (
        <a.circle
          cx={14}
          cy={0}
          r={2}
          fill="white"
          transform={to([direction], (direction) => `rotate(${direction}, 0, 0)`)}
        ></a.circle>
      )}
    </a.g>
  )
}

export default Pin
// /** @jsxImportSource @emotion/react */
// import { FC, useCallback, useRef, MouseEventHandler, useState, useLayoutEffect } from 'react'
// import { a, to } from '@react-spring/web'
// import { isEqual, throttle } from 'lodash'

// import { createLine, createPoint, getLinesIntersection, TLine } from './geometryHelpers'
// import { TLevel, TViewport } from '../Viewport'
// import { TPin } from '../../../../store'

// const Pin: FC<
//   TPin & {
//     viewport: TViewport
//     level: TLevel
//     onRemove: (id: string) => void
//     onCenter: (id: string) => void
//   }
// > = ({ id, label, x, y, viewport, level, onCenter, onRemove }) => {
//   const pinElementRef = useRef<SVGGElement | null>(null)
//   const directionElementRef = useRef<SVGCircleElement | null>(null)
//   const isInViewportRef = useRef<boolean>(false) // ? why do i need this?
//   const [interpolation, setInterpolation] = useState<any>(null)

//   // * I had to use interpolation as a spring values subscriber (scale, offset) so that I could use shared logic to change several attributes of different DOM elements at once (otherwise it would be a lot of duplication)
//   // todo: think if there is a better way of doing it ^
//   // todo: optimize
//   useLayoutEffect(() => {
//     let memo = [0, [0, 0]]

//     const interpolate = throttle((...props) => {
//       if (isEqual(memo, props)) return
//       memo = props
//       const [scale, [offX, offY]] = props

//       const pinElement = pinElementRef.current
//       const directionElement = directionElementRef.current
//       if (!pinElement || !directionElement) return

//       const levelWidth = level.baseWidth * scale
//       const levelHeight = level.baseHeight * scale
//       if (!levelWidth || !levelHeight) return

//       const padding = 20
//       const xPad = padding / levelWidth
//       const yPad = padding / levelHeight

//       // had some issues with numbers, so needed this little func. maybe use some lib?
//       const toFixed = (n: number) => Number(n.toFixed(6))
//       const halfViewportWidth = toFixed(viewport.width / 2 / levelWidth)
//       const halfViewportHeight = toFixed(viewport.height / 2 / levelHeight)

//       /*
//          level
//          ___________________________
//         |                           | Vieport coordinates are mapped to level
//         |     viewport              |
//         |     a ------ b      pin   | Level offset [0, 0] means that the level's left top corner
//         |     |   e----|-----*      | is at viewport's center (point 'e')
//         |     d ------ c  ^pin line |
//         |                           |
//         |___________________________|
//       */

//       // viewport rect points mapped to level
//       const a = createPoint(offX - halfViewportWidth + xPad, offY - halfViewportHeight + yPad)
//       const b = createPoint(offX + halfViewportWidth - xPad, offY - halfViewportHeight + yPad)
//       const c = createPoint(offX + halfViewportWidth - xPad, offY + halfViewportHeight - yPad)
//       const d = createPoint(offX - halfViewportWidth + xPad, offY + halfViewportHeight - yPad)
//       const e = createPoint(offX, offY)

//       isInViewportRef.current = x > a.x && y > a.y && x < c.x && y < c.y

//       // if the pin is in the viewport then just using use it's coordinates

//       if (isInViewportRef.current) {
//         pinElement.setAttribute('transform', `translate(${x * levelWidth}, ${y * levelHeight})`)
//         directionElement.setAttribute('display', 'none')
//         return
//       }

//       // otherwise clamping the pin to the side of the viewport

//       // viewport segments lines
//       const ab = createLine(a, b)
//       const bc = createLine(b, c)
//       const cd = createLine(c, d)
//       const da = createLine(d, a)
//       const ac = createLine(a, c)
//       const bd = createLine(b, d)

//       const pinPoint = createPoint(x, y)
//       const pinLine = createLine(e, pinPoint)

//       // finding which side of the viewport to use to get intersection with the pinLine

//       const viewportSideLinesMapping: { [key: string]: TLine } = {
//         '-1,-1': ab,
//         '0,-1': ab,
//         '-1,0': ab,
//         '0,0': ab,
//         '-1,1': bc,
//         '1,1': cd,
//         '0,1': cd,
//         '1,0': cd,
//         '1,-1': da,
//       }

//       if (!ac.f || !bd.f) throw new Error()
//       const sideKey = `${Math.sign(y - ac.f(x))},${Math.sign(y - bd.f(x))}`
//       const sideLine = viewportSideLinesMapping[sideKey]

//       // clamping the pin

//       const intersection = getLinesIntersection(pinLine, sideLine)
//       if (!intersection) throw new Error('Unexpected')
//       pinElement.setAttribute(
//         'transform',
//         `translate(${intersection.x * levelWidth}, ${intersection.y * levelHeight})`
//       )

//       // rotating direction element ('arrow') in a direction of an actual pin's coordinates

//       if (!pinLine.slope) return
//       const slope = -pinLine.slope
//       const radians = Math.atan(slope)
//       const degrees = radians * (180 / Math.PI)

//       if (Math.sign(slope) === 1) {
//         const deg = sideLine === ab || sideLine === bc ? degrees : degrees + 180
//         directionElement.setAttribute('transform', `rotate(${-deg}, 0, 0)`)
//       } else {
//         const deg = sideLine === bc || sideLine === cd ? degrees : degrees + 180
//         directionElement.setAttribute('transform', `rotate(${-deg}, 0, 0)`)
//       }

//       directionElement.setAttribute('display', 'block')
//     }, 10)

//     setInterpolation(to([level.scale, level.offset] as any, interpolate))
//   }, [viewport, level, x, y])

//   const onClick: MouseEventHandler<SVGGElement> = useCallback(() => {
//     if (isInViewportRef.current) return onRemove(id)
//     onCenter(id)
//   }, [id, onRemove, onCenter])

//   return (
//     <g ref={pinElementRef} onClick={onClick} css={{ cursor: 'pointer' }}>
//       <circle r={8} fill="green" stroke="white" strokeWidth="2" />
//       <text x={-3.3} y={4.2} fontSize={12} fill="white">
//         {label}
//       </text>
//       <circle ref={directionElementRef} cx={14} cy={0} r={2} fill="white"></circle>
//       <a.g>{interpolation}</a.g>
//     </g>
//   )
// }

// export default Pin
