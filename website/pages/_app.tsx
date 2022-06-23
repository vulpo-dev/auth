import { useEffect } from 'react'
import * as Sentry from "@sentry/browser";
import { BrowserTracing } from "@sentry/tracing";

import '../scripts/prism'
import '../styles/prism.css'
import '@vulpo-dev/auth-ui/styles.css'
import '../styles/globals.css'

import type { AppProps } from 'next/app'


function MyApp({ Component, pageProps }: AppProps) {

  useEffect(() => {
    let doNotTrack = (
      navigator.doNotTrack === '1' ||
      process.env.NODE_ENV !== 'production' ||
      window.location.hostname === 'localhost'
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

    window.document.head.appendChild(plausible)
  }, [])

  return <Component {...pageProps} />
}

export default MyApp
