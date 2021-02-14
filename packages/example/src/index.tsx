import React from 'react';
import ReactDOM from 'react-dom';
import '@biotic-ui/leptons/style/base.css'
import './index.css';
import Bootstrap from './Bootstrap';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom'
import { Auth as AuthCtx } from '@riezler/auth-react'
import AuthClient from './Auth'


ReactDOM.render(
  <React.StrictMode>
  	<BrowserRouter>
	  	<AuthCtx.Provider value={AuthClient}>
	    	<Bootstrap />
	  	</AuthCtx.Provider>
  	</BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
