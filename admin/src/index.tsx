import React from 'react'
import ReactDOM from 'react-dom'
import 'style'

import Bootstrap from 'bootstrap'

ReactDOM.render(
  <React.StrictMode>
    <Bootstrap />
  </React.StrictMode>,
  document.getElementById('root')
)

console.log('Version: ', process.env.REACT_APP_VERSION)
