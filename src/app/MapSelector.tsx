/** @jsxImportSource @emotion/react */
import { FC } from 'react'
import { Link } from 'react-router-dom'

import db from '../database'

const MapSelector: FC = () => (
  <div css={{ display: 'grid', gap: '1rem', padding: '1rem' }}>
    {db.maps.map(({ id, slug, name, preview }) => (
      <Link
        key={id}
        to={slug}
        css={{
          width: '16rem',
          height: '9rem',
          textDecoration: 'none',
          background: `url(${preview}) center / cover no-repeat`,
        }}
      >
        <h3 style={{ textTransform: 'uppercase', margin: '0', float: 'left', color: 'white' }}>
          {name}
        </h3>
      </Link>
    ))}
  </div>
)

export default MapSelector
