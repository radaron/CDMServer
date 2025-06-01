import React from 'react'
import ReactDOM from 'react-dom/client'
import { Router } from './Router'

const rootElement = document.getElementById('root')!
const root = ReactDOM.createRoot(rootElement)
root.render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
)
