import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <link rel="icon" href="/favicon.ico?v2" />
        </Head>
        <body>
          <Main />
          <NextScript />

          <script defer async src="/scripts/prism.js"></script>
        </body>
      </Html>
    )
  }
}

export default MyDocument