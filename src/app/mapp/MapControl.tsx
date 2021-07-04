/** @jsxImportSource @emotion/react */
import { FC, useCallback } from 'react'
import proxyState from '../../store'

type TMapControlProps = {
  variant: 'minimized' | 'maximized'
  width: number
  height: number
  left: number
  top: number
}

const MapControl: FC<TMapControlProps> = ({ variant, width, height, left, top }) => {
  const toggleControlsOrientation = useCallback(() => {
    proxyState.controls.orientation =
      proxyState.controls.orientation === 'horizontal' ? 'vertical' : 'horizontal'
  }, [])

  return (
    <div
      style={{ width, height, position: 'absolute', left, top, padding: 2, transition: 'all .3s' }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#2f2f2f',
          color: 'white',
          border: '1px solid #353535',
          borderRadius: 3,
        }}
      >
        <button onClick={toggleControlsOrientation}>{'--'}</button>
        <button>{'+/-'}</button>
        <button>{'<->'}</button>
        <p>"click" opens map's selector below</p>
      </div>
    </div>
  )
}

export type { TMapControlProps }
export default MapControl
