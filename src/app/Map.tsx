/** @jsxImportSource @emotion/react */
import { useEffect, useMemo } from 'react'
import { useParams, useHistory } from 'react-router-dom'

import { getMapBySlug } from '../database'
import proxyState from '../store'

import Sidebar from './map/Sidebar'
import Layout from './map/Layout'

const Map = () => {
  const routerHistory = useHistory()
  const routerParams = useParams<{ map: string }>()

  const map = useMemo(() => getMapBySlug(routerParams.map), [routerParams.map])

  useEffect(() => {
    if (!map) return routerHistory.replace('/')
    proxyState.map = map
  }, [map, routerHistory])

  return (
    <div css={{ display: 'grid', gridTemplateColumns: '20rem auto', height: '100%' }}>
      <Sidebar />
      <Layout />
    </div>
  )
}

export default Map
