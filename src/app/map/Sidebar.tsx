/** @jsxImportSource @emotion/react */
import { ChangeEvent, FC, useCallback } from 'react'
import { useHistory } from 'react-router-dom'
import { noop } from 'lodash'
import { useSnapshot } from 'valtio'

import db, { getLevelById } from '../../database'
import { VIEWPORTS_LIMIT } from '../../config'
import proxyState, { toggleBoundViewOffset, toggleBoundViewScale, toggleLevel } from '../../store'

const Sidebar: FC = () => {
  const state = useSnapshot(proxyState)
  const routerHistory = useHistory()

  const onMapChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      routerHistory.push(`/${event.target.value}`)
    },
    [routerHistory]
  )

  if (!state.map) return null

  return (
    <div
      css={{
        position: 'absolute',
        width: 300,
        height: '100%',
        top: 0,
        left: 0,
        overflowY: 'auto',
      }}
    >
      <select value={state.map.slug} onChange={onMapChange}>
        {db.maps.map(({ id, slug, name }) => (
          <option key={id} value={slug}>
            {name}
          </option>
        ))}
      </select>
      <button>{`<< toggle sidebar`}</button>
      <img src={state.map.preview} alt={state.map.name} css={{ maxWidth: '100%' }} />
      <h1>{state.map.name}</h1>
      <h4>{state.map.location}</h4>
      <p>{state.map.description}</p>
      <small>Released: {new Date(state.map.released).toDateString()}</small>
      <br />
      {state.map.reworked && <small>Reworked: {new Date(state.map.reworked).toDateString()}</small>}
      <div>
        <button
          css={{
            border: state.layout.boundViewOffset.status === 'enabled' ? '1px solid blue' : 'none',
          }}
          onClick={toggleBoundViewOffset}
        >
          bind offset
        </button>
        <button
          css={{
            border: state.layout.boundViewScale.status === 'enabled' ? '1px solid blue' : 'none',
          }}
          onClick={toggleBoundViewScale}
        >
          bind scale
        </button>
      </div>
      <div css={{ display: 'grid', rowGap: '1px', padding: '1px' }}>
        {state.map.levels.map((id) => {
          const level = getLevelById(id)
          if (!level) throw new Error('Level not found.')
          const isViewing = state.levels.includes(id)
          const isDisabled = !isViewing && state.levels.length >= VIEWPORTS_LIMIT
          return (
            <div
              key={id}
              css={{
                width: '100%',
                height: '6rem',
                background: `url(${level.blueprint}) center no-repeat`,
                backgroundSize: isViewing ? '130%' : '100%',
                color: isDisabled ? 'black' : isViewing ? 'white' : 'gray',
                cursor: isDisabled ? 'auto' : 'pointer',
                textTransform: 'uppercase',
                // todo: mouse follow parallax
                // todo: faster animation when leave
                transition: 'all 1s cubic-bezier(.09,.98,.62,1)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '3.5rem',
                fontWeight: 'bold',
                textShadow: '2px 2px 2px black',
                ':hover': isDisabled ? {} : { backgroundSize: '130%' },
              }}
              onClick={isDisabled ? noop : () => toggleLevel(id)}
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
