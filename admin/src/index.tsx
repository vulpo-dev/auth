import React from 'react'
import ReactDOM from 'react-dom'

import '@biotic-ui/leptons/style/base.css'
import '@vulpo-dev/auth-ui/styles.css'
import 'style/index.css'
import 'style/font.css'

import Bootstrap from 'bootstrap'

ReactDOM.render(
  <React.StrictMode>
    <Bootstrap />
  </React.StrictMode>,
  document.getElementById('root')
)

declare global {
  interface Window {
    version: () => void;
  }
}

declare var VERSION: string;
window.version = () => {
  if (VERSION) {
    console.log(`%cVersion: ${VERSION}`, `
      font-size: 2rem;
      background: #2D2B4F;
      padding: 0.25rem 1rem;
      color: #fff;
      font-weight: bold;
    `)
  } 
}

window.version()
