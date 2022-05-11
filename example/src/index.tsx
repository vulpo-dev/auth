import React from 'react';
import { createRoot } from 'react-dom/client'
import './index.css';
import '@riezler/auth-ui/styles.css'
import Bootstrap from './Bootstrap';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom'
import { Auth as AuthCtx } from '@riezler/auth-react'
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

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
