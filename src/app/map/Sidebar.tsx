/** @jsxImportSource @emotion/react */
import { ChangeEventHandler, CSSProperties, FC, useCallback, useMemo } from 'react'
import { noop } from 'lodash'

import db, { getLevelById, getMapById } from '../../database'
import { TLevel, TLevelStatus } from '../Map'

const Sidebar: FC<{
  width: number
  height: number
  left: number
  top: number
  mapId: string
  levels: TLevel[]
  onMapChange: (id: string) => void
  onLevelClick: (id: string) => void
}> = ({ width, height, left, top, mapId, levels, onMapChange, onLevelClick }) => {
  const map = useMemo(() => getMapById(mapId), [mapId])

  const handleMapChange: ChangeEventHandler<HTMLSelectElement> = useCallback(
    (event) => onMapChange(event.target.value),
    [onMapChange]
  )

  if (!map) return null

  return (
    <div style={{ width, height, position: 'absolute', left, top, overflowY: 'auto' }}>
      <select value={map.id} onChange={handleMapChange}>
        {db.maps.map(({ id, name }) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
      <img src={map.preview} alt={map.name} style={{ maxWidth: '100%' }} />
      <h1>{map.name}</h1>
      <h4>{map.location}</h4>
      <p>{map.description}</p>
      <small>Released: {new Date(map.released).toDateString()}</small>
      <br />
      {map.reworked && <small>Reworked: {new Date(map.reworked).toDateString()}</small>}
      <div style={{ display: 'grid', rowGap: '1px', padding: '1px' }}>
        {levels.map(({ id, status }) => {
          const level = getLevelById(id)
          if (!level) throw new Error('Level not found.')
          const style: { [status in TLevelStatus]: CSSProperties } = {
            disabled: { backgroundSize: '100%', color: 'black', cursor: 'auto' },
            enabled: { backgroundSize: '100%', color: 'gray', cursor: 'pointer' },
            active: { backgroundSize: '130%', color: 'white', cursor: 'pointer' },
          }
          return (
            <div
              key={id}
              style={{
                width: '100%',
                height: '6rem',
                background: `url(${level.blueprint.src}) center no-repeat`,
                textTransform: 'uppercase',
                transition: 'all 1s cubic-bezier(.09,.98,.62,1)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '3.5rem',
                fontWeight: 'bold',
                textShadow: '2px 2px 2px black',
                ...style[status],
              }}
              css={{
                ':hover': {
                  backgroundSize:
                    status === 'enabled'
                      ? style.active.backgroundSize
                      : style[status].backgroundSize,
                },
              }}
              onClick={() => onLevelClick(id)}
            >
              {level.type}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Sidebar
