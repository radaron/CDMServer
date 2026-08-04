import React from 'react'
import ReactDOM from 'react-dom/client'
import { Router } from './Router'
import { primeToken } from './api'

const rootElement = document.getElementById('root')!
const root = ReactDOM.createRoot(rootElement)

primeToken().then(() => {
  root.render(
    <React.StrictMode>
      <Router />
    </React.StrictMode>
  )
})
