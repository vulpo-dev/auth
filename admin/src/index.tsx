import React from 'react'
import { createRoot } from 'react-dom/client'

import '@biotic-ui/leptons/style/base.css'
import '@vulpo-dev/auth-ui/styles.css'
import 'style/index.css'
import 'style/font.css'

import Bootstrap from 'bootstrap'

let root = createRoot(
  document.getElementById('root')!
)

root.render(
  <React.StrictMode>
    <Bootstrap />
  </React.StrictMode>
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
