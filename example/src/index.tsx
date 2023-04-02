import React from 'react';
import { createRoot } from 'react-dom/client'
import './index.css';
import '@vulpo-dev/auth-ui/styles.css'
import Bootstrap from './Bootstrap';
import { BrowserRouter } from 'react-router-dom'
import { Auth as AuthCtx } from '@vulpo-dev/auth-react'
import AuthClient from './Auth'

let root = createRoot(
	document.getElementById('root')!
)

root.render(
  <React.StrictMode>
  	<BrowserRouter>
	  	<AuthCtx.Provider value={AuthClient}>
	    	<Bootstrap />
	  	</AuthCtx.Provider>
  	</BrowserRouter>
  </React.StrictMode>
);
