import '../scripts/prism'
import '../styles/prism.css'

import '@riezler/auth-ui/styles.css'
import '../styles/globals.css'

import type { AppProps } from 'next/app'


function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

export default MyApp
