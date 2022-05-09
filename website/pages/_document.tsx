
import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" /> 
          <link href="https://fonts.googleapis.com/css2?family=Prompt:ital,wght@0,400;0,800;1,900&display=swap" rel="stylesheet" /> 
          <link rel="icon" href="/favicon.ico?v2" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument