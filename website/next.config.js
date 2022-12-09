let path = require('path')
let fs = require('fs')

let exampleCode = fs.readFileSync(
  path.join(__dirname, './components/auth_example.tsx'),
  { encoding: 'utf8' }
)

/** @type {import('next').NextConfig} */
module.exports = {
  productionBrowserSourceMaps: true,
  reactStrictMode: true,
  env: {
    exampleCode
  },

  webpack(config) {
    return config
  }
}
