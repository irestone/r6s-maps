import { xor } from 'lodash'
import { proxy } from 'valtio'

import { TMap } from './database'

type TState = {
  map: TMap | null
  levels: number[] // TLevel{id}[]
  layout: {
    size: [number, number]
    boundViewOffset: {
      status: 'disabled' | 'enabled'
      targetId: string
      value: number[]
    }
    boundViewScale: {
      status: 'disabled' | 'enabled'
      targetId: string
      value: number
    }
  }
}

const proxyState = proxy<TState>({
  map: null,
  levels: [],
  layout: {
    size: [0, 0],
    boundViewOffset: {
      status: 'enabled',
      targetId: '',
      value: [0, 0],
    },
    boundViewScale: {
      status: 'enabled',
      targetId: '',
      value: 1,
    },
  },
})

const toggleLevel = (id: number) => (proxyState.levels = xor(proxyState.levels, [id]))

const toggleBoundViewOffset = () => {
  if (proxyState.layout.boundViewOffset.status === 'disabled') {
    proxyState.layout.boundViewOffset.value = [0.5, 0.5]
    proxyState.layout.boundViewOffset.targetId = ''
    proxyState.layout.boundViewOffset.status = 'enabled'
    return
  }
  if (proxyState.layout.boundViewOffset.status === 'enabled') {
    proxyState.layout.boundViewOffset.status = 'disabled'
    return
  }
  throw new Error('Unknown status')
}

const toggleBoundViewScale = () => {
  if (proxyState.layout.boundViewScale.status === 'disabled') {
    proxyState.layout.boundViewScale.value = 1
    proxyState.layout.boundViewScale.targetId = ''
    proxyState.layout.boundViewScale.status = 'enabled'
    return
  }
  if (proxyState.layout.boundViewScale.status === 'enabled') {
    proxyState.layout.boundViewScale.status = 'disabled'
    return
  }
  throw new Error('Unknown status')
}

const isBoundViewOffsetEnabled = () => proxyState.layout.boundViewOffset.status === 'enabled'
const isBoundViewScaleEnabled = () => proxyState.layout.boundViewScale.status === 'enabled'

export {
  toggleLevel,
  toggleBoundViewOffset,
  toggleBoundViewScale,
  isBoundViewOffsetEnabled,
  isBoundViewScaleEnabled,
}
export default proxyState
