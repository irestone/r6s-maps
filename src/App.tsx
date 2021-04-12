/** @jsxImportSource @emotion/react */
import { FC } from 'react'
import { BrowserRouter, Switch, Route } from 'react-router-dom'
import { Global as GlobalStyles } from '@emotion/react'

import MapSelector from './app/MapSelector'
import Map from './app/Map'

const App: FC = () => {
  return (
    <>
      <BrowserRouter>
        <Switch>
          <Route path="/" exact>
            <MapSelector />
          </Route>
          <Route path="/:map" exact>
            <Map />
          </Route>
        </Switch>
      </BrowserRouter>
      <GlobalStyles
        styles={{
          '*, *:before, *:after': { boxSizing: 'border-box' },
          'html, body, #root': { height: '100%' },
          html: { font: '16px sans-serif' },
          body: { margin: 0, padding: 0 },
        }}
      />
    </>
  )
}

export default App
