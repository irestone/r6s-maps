import { find, sortBy, uniqueId, xor, xorBy } from 'lodash'
import { proxy } from 'valtio'
import { PINS_LIMIT } from './config'

import { TMap } from './database'

type TPin = { id: string; label: number; x: number; y: number }
type TControlsOrientation = 'vertical' | 'horizontal'

type TState = {
  map: TMap | null
  levels: number[] // TLevel{id}[]
  layout: {
    size: [number, number]
    boundOffset: {
      status: 'disabled' | 'enabled'
      targetId: string
      value: number[]
    }
    boundScale: {
      status: 'disabled' | 'enabled'
      targetId: string
      value: number
    }
  }
  pins: TPin[]
  controls: {
    orientation: TControlsOrientation
  }
}

const proxyState = proxy<TState>({
  map: null,
  levels: [],
  layout: {
    size: [0, 0],
    boundOffset: {
      status: 'enabled',
      targetId: '',
      value: [0, 0],
    },
    boundScale: {
      status: 'enabled',
      targetId: '',
      value: 1,
    },
  },
  pins: [],
  controls: {
    orientation: 'horizontal',
  },
})

const toggleLevel = (id: number) => (proxyState.levels = xor(proxyState.levels, [id]))

const toggleBoundOffset = () => {
  if (proxyState.layout.boundOffset.status === 'disabled') {
    proxyState.layout.boundOffset.value = [0.5, 0.5]
    proxyState.layout.boundOffset.targetId = ''
    proxyState.layout.boundOffset.status = 'enabled'
    return
  }
  if (proxyState.layout.boundOffset.status === 'enabled') {
    proxyState.layout.boundOffset.status = 'disabled'
    return
  }
  throw new Error('Unknown status')
}

const toggleBoundScale = () => {
  if (proxyState.layout.boundScale.status === 'disabled') {
    proxyState.layout.boundScale.value = 1
    proxyState.layout.boundScale.targetId = ''
    proxyState.layout.boundScale.status = 'enabled'
    return
  }
  if (proxyState.layout.boundScale.status === 'enabled') {
    proxyState.layout.boundScale.status = 'disabled'
    return
  }
  throw new Error('Unknown status')
}

const isBoundOffsetEnabled = () => proxyState.layout.boundOffset.status === 'enabled'
const isBoundOffsetTarget = (id: string) => proxyState.layout.boundOffset.targetId === id
const getBoundOffset = () => proxyState.layout.boundOffset.value
const setBoundOffset = (targetId: string, value: number[]) => {
  if (!isBoundOffsetEnabled()) return
  proxyState.layout.boundOffset.targetId = targetId
  proxyState.layout.boundOffset.value = value
}

const isBoundScaleEnabled = () => proxyState.layout.boundScale.status === 'enabled'
const isBoundScaleTarget = (id: string) => proxyState.layout.boundScale.targetId === id
const getBoundScale = () => proxyState.layout.boundScale.value
const setBoundScale = (targetId: string, value: number) => {
  if (!isBoundScaleEnabled()) return
  proxyState.layout.boundScale.targetId = targetId
  proxyState.layout.boundScale.value = value
}

const addPin = (x: number, y: number) => {
  if (proxyState.pins.length === PINS_LIMIT) return
  const sortedPins = sortBy(proxyState.pins, ['label'])
  const label = sortedPins.findIndex((item, i) => item.label !== i + 1) + 1 || sortedPins.length + 1
  const pin = { id: uniqueId(), label, x, y }
  proxyState.pins = [...proxyState.pins, pin]
  return pin
}

const removePin = (id: string) => {
  const pin = find(proxyState.pins, { id })
  if (!pin) return
  proxyState.pins = xorBy(proxyState.pins, [pin], 'id')
}

// devtools(proxyState, '')

export type { TControlsOrientation, TPin }
export {
  toggleLevel,
  toggleBoundOffset,
  toggleBoundScale,
  isBoundOffsetEnabled,
  isBoundOffsetTarget,
  getBoundOffset,
  setBoundOffset,
  isBoundScaleEnabled,
  isBoundScaleTarget,
  getBoundScale,
  setBoundScale,
  addPin,
  removePin,
}
export default proxyState
