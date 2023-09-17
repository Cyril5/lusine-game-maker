import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './assets/css/index.scss'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Button, ButtonGroup } from 'react-bootstrap'
import Editor from './components/Editor'

const App = ()=> {

  return (
    <>
      <Editor/>

      {/* <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo" alt="Vite logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p> */}
    </>
  )
}

export default App
