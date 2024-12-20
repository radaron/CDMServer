import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Login } from './Login';
import { Manage } from './Manage';


export const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login/>} />
        <Route path="/manage" element={<Manage/>} />
      </Routes>
    </BrowserRouter>
  )
}
