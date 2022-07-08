import { useEffect } from 'react'
import * as Sentry from "@sentry/browser";
import { BrowserTracing } from "@sentry/tracing";

import Prism from 'prismjs'

import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-json'
import 'prismjs/themes/prism-okaidia.css'

import '@vulpo-dev/auth-ui/styles.css'
import '../styles/globals.css'

import type { AppProps } from 'next/app'


function MyApp({ Component, pageProps }: AppProps) {

  useEffect(() => {
    Prism.highlightAll()
  })

  useEffect(() => {
    let params = new URLSearchParams(window.location.search)

    let doNotTrack = (
      navigator.doNotTrack === '1' ||
      process.env.NODE_ENV !== 'production' ||
      window.location.hostname === 'localhost' ||
      params.has('doNotTrack')
    )
    
    if (doNotTrack) {
      return
    }

    Sentry.init({
      dsn: process.env.NEXT_SENTRY_DSN,
      integrations: [new BrowserTracing()],
      tracesSampleRate: 1.0,
    })

    let plausible = document.createElement('script')
    plausible.src = 'https://plausible.io/js/plausible.js'
    plausible.setAttribute('data-domain', 'auth.vulpo.dev')
    plausible.setAttribute('defer', '')
    plausible.setAttribute('type', 'text/javascript')

    window.document.head.appendChild(plausible)

    if (params.has('heatmap')) {
      // @ts-ignore
      window._mfq = window._mfq || [];
      let mf = document.createElement("script");
      mf.type = "text/javascript";
      mf.defer = true;
      mf.src = "https://cdn.mouseflow.com/projects/83dfc88b-f41f-49dd-a4be-b3ac82501a29.js";
      document.getElementsByTagName("head")[0].appendChild(mf);
    }
  }, [])

  return <Component {...pageProps} />
}

export default MyApp
