import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Login } from './Login'
import { Manage } from './Manage'
import { initI18next } from './translation'
import { getLanguageFromUrl } from './util'

initI18next(getLanguageFromUrl())

export const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"/>
          <Route path=":lang" >
            <Route path="login" element={<Login/>} />
            <Route path="manage" element={<Manage/>} />
          </Route>
        <Route/>
      </Routes>
    </BrowserRouter>
  )
}
