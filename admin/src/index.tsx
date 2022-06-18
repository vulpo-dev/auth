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
