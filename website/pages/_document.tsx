import Document, { Html, Head, Main, NextScript } from 'next/document'
import { ClipboardText } from 'phosphor-react'

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <link rel="icon" href="/favicon.ico?v2" />
          <script async src="https://tally.so/widgets/embed.js"></script>
        </Head>
        <body>
          <Main />
          <button className='survey' data-tally-open="mRGY2v">
            <ClipboardText size={28} />
          </button>
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument