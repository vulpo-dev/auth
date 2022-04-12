let path = require('path')
let fs = require('fs')

let exampleCode = fs.readFileSync(
  path.join(__dirname, './components/auth_example.tsx'),
  { encoding: 'utf8' }
)

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  env: {
    exampleCode
  },

  webpack(config) {
    return {
      ...config,
      resolve: {
        ...(config.resolve ?? {}),
        alias: {
          ...(config?.resolve?.alias ?? {}),
          react: path.resolve('./node_modules/react'),
          'react-router-dom': path.resolve('./node_modules/react-router-dom'),
        }
      }
    }
  }
}
