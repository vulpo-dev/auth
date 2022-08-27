import { useEffect } from 'react'

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

    let use = (params.get('use') ?? '').split(',')

    import('@sentry/browser')
      .then(Sentry => { Sentry.init({ dsn: process.env.NEXT_SENTRY_DSN }) })
      .catch(() => {})

    let pirsch = document.createElement('script')
    pirsch.setAttribute('src', 'https://api.pirsch.io/pirsch.js')
    pirsch.setAttribute('data-code', 'Sm6vcDWFZdo3UVgWd9FpRmkfh3SgLgEG')
    pirsch.setAttribute('id', 'pirschjs')
    pirsch.setAttribute('defer', '')
    pirsch.setAttribute('type', 'text/javascript')

    window.document.head.appendChild(pirsch)

    if (params.has('heatmap') || use.includes('h')) {
      // @ts-ignore
      window._mfq = window._mfq || [];
      let mf = document.createElement("script");
      mf.setAttribute('type', 'text/javascript');
      mf.setAttribute('defer', '')
      mf.setAttribute('src', 'https://cdn.mouseflow.com/projects/83dfc88b-f41f-49dd-a4be-b3ac82501a29.js')

      window.document.head.appendChild(mf)
    }
  }, [])

  return <Component {...pageProps} />
}

export default MyApp
