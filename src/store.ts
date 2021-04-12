import { xor } from 'lodash'
import { proxy } from 'valtio'

import { TMap } from './database'

type TState = {
  map: TMap | null
  levels: number[] // TLevel{id}[]
}

const proxyState = proxy<TState>({ map: null, levels: [] })

const toggleLevel = (id: number) => (proxyState.levels = xor(proxyState.levels, [id]))

export { toggleLevel }
export default proxyState
