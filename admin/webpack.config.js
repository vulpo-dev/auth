let { CleanWebpackPlugin } = require('clean-webpack-plugin')
let MiniCssExtractPlugin = require('mini-css-extract-plugin')
let HtmlWebpackPlugin = require("html-webpack-plugin")
let ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
let ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
let TerserPlugin = require('terser-webpack-plugin')
let CssMinimizerPlugin = require("css-minimizer-webpack-plugin")
let { DefinePlugin } = require('webpack')

let webpackDevClientEntry = require.resolve(
  'react-dev-utils/webpackHotDevClient'
)

let reactRefreshOverlayEntry = require.resolve(
  'react-dev-utils/refreshOverlayInterop'
)

let path = require('path')

let cwd = process.cwd()
let src = path.resolve(cwd, 'src')

let publicPath = '/dashboard'

module.exports = function createConfig (_, argv) {
  console.log('Version: ', process.env.VulpoAuthVersion)
  
  let isDevelopment = isDev(argv)
  console.log('Mode: ', isDevelopment ? 'development' : 'production')

  if (isDevelopment) {
    // set terminal title
    process.stdout.write(
      String.fromCharCode(27) + ']0;' + 'Admin:9000' + String.fromCharCode(7)
    )
  }

  return {
      entry: [ '@babel/polyfill'
             , path.resolve(src, 'index.tsx')
             ]
    , bail: !isDev
    , devServer:
        { contentBase: path.join(__dirname, 'build')
        , compress: true
        , port: 9000
        , contentBasePublicPath: '/'
        , historyApiFallback:
            { index: `${publicPath}/index.html`
            }
        , publicPath
        , proxy: {
            '/admin/__/': 'http://127.0.0.1:8000',
            '/token/': 'http://127.0.0.1:8000',
            '/password/': 'http://127.0.0.1:8000',
            '/user/': 'http://127.0.0.1:8000',
            '/project/': 'http://127.0.0.1:8000',
            '/settings/': 'http://127.0.0.1:8000',
            '/template/': 'http://127.0.0.1:8000',
            '/keys/': 'http://127.0.0.1:8000',
            '/oauth/': 'http://127.0.0.1:8000',
          }
        , hot: true
        }

    , output:
        { filename: fileName(isDevelopment)
        , path: __dirname + '/build'
        , chunkFilename: '[name].[contenthash:8].chunk.js'
        , globalObject: 'this'
        , publicPath
        }

    , devtool: isDevelopment ? 'eval-cheap-source-map' : 'source-map'

    , optimization: optimization(isDevelopment)

    , resolve:
        { modules: [src, 'node_modules']
        , extensions: ['.ts', '.tsx', '.js', '.json']
        , alias:
            { react: path.resolve('./node_modules/react')
            , 'styled-components': path.resolve('./node_modules/styled-components')
            , 'react-router-dom': path.resolve('./node_modules/react-router-dom')
            , 'i18next': path.resolve('./node_modules/i18next')
            , 'react-i18next': path.resolve('./node_modules/react-i18next')
            , 'recoil': path.resolve('./node_modules/recoil')
            , 'axios': path.resolve('./node_modules/axios'),
            }
        }

    , module:
        { rules:
            [ { test: /\.js$/,
                enforce: "pre",
                use: ["source-map-loader"],
              }

            , { test: /\.(ts|tsx)$/
              , exclude: /node_modules/
              , loader: 'babel-loader'
              , options: { rootMode: 'upward' }
              }

            , { test: /\.(js|jsx)$/
              , exclude: /node_modules/
              , include: path.resolve(__dirname, 'src')
              , use: 
                  { loader: 'babel-loader'
                  , options: {
                        plugins:
                          [ 'babel-plugin-styled-components'
                          , "@babel/plugin-proposal-class-properties"
                          // , isDevelopment && require.resolve('react-refresh/babel')
                          ].filter(Boolean)

                      , presets:
                          [ '@babel/typescript'
                          , [ '@babel/preset-react', { "runtime": "automatic" }]
                          , [ '@babel/preset-env', { "targets": "last 2 versions" }]
                          ]

                      , cacheDirectory: true
                      , cacheCompression: true
                      , compact: !isDevelopment,
                    }
                  }
              }

            , { test: /\.(?:ico|gif|png|jpg|jpeg)$/i
              , use: [
                  { loader: 'file-loader'
                  , options: {
                      name: 'static/media/[name].[ext]',
                      publicPath
                    }
                  }
                ]
              }

            , { test: /\.(woff(2)?|eot|ttf|otf|svg|)$/
              , use: [
                  { loader: 'file-loader'
                  , options: {
                      name: 'static/fonts/[name].[ext]',
                      publicPath
                    }
                  }
                ]
              }

            , { test: /\.(css)$/
              , use: getStyleLoaders(isDevelopment)
              , sideEffects: true
              }
            ]
        }

    , plugins:
        [ new CleanWebpackPlugin()
        , new DefinePlugin({
            'VERSION': JSON.stringify(process.env.VulpoAuthVersion),
          })
        , html(isDevelopment)
        , css(isDevelopment)
        , new ForkTsCheckerWebpackPlugin({
            typescript: {
              diagnosticOptions: {
                semantic: true,
                syntactic: true,
              },
            },
          })
        , isDevelopment && new ReactRefreshWebpackPlugin()
        ].filter(Boolean)
    } 
}

let isDev = ({ mode }) => {
  return mode === 'development'
}

function html(isDev) {

  let defaultConfig = {
    inject: true,
    template: path.resolve(cwd, 'public/index.html'),
    scriptLoading: 'defer'
  }

  let prodConfig = {
    minify: {
      removeComments: true,
      collapseWhitespace: true,
      removeRedundantAttributes: true,
      useShortDoctype: true,
      removeEmptyAttributes: true,
      removeStyleLinkTypeAttributes: true,
      keepClosingSlash: true,
      minifyJS: true,
      minifyCSS: true,
      minifyURLs: true,
    },
  }

  let config = Object.assign({}, defaultConfig, !isDev ? prodConfig : {})

  return new HtmlWebpackPlugin(config)
}

function fileName(isDev) {
  return isDev
    ? 'static/js/bundle.js'
    : 'static/js/[name].[contenthash:8].js'
}

function css(isDev) {

  if (isDev) {
    return null
  }

  return new MiniCssExtractPlugin({
    filename: 'static/css/[name].[contenthash:8].css',
    chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
  })
}

const getStyleLoaders = (isDev) => {
  const loaders = [
    isDev && require.resolve('style-loader'),
    !isDev && {
      loader: MiniCssExtractPlugin.loader,
      // css is located in `static/css`, use '../../' to locate index.html folder
      // in production `paths.publicUrlOrPath` can be a relative path
      options: { publicPath }
    },
    {
      loader: require.resolve('css-loader'),
      options: {
        importLoaders: 1,
        sourceMap: !isDev,
      },
    },
    require.resolve('postcss-loader')
  ].filter(Boolean);

  return loaders;
};

function optimization(isDev) {
  if (isDev) {
    return {
        removeAvailableModules: false
      , removeEmptyChunks: false
      , splitChunks: false
      , runtimeChunk: false
      }
  }

  return {
    minimize: true,
    minimizer: [

      new TerserPlugin({
        terserOptions: {
          parse: { ecma: 8 },
          compress: {
            ecma: 5,
            warnings: false,
            comparisons: false,
            inline: 2,
          },
          mangle: {
            safari10: true,
          },

          keep_classnames: true,
          keep_fnames: true,
          output: {
            ecma: 5,
            comments: false,
            ascii_only: true,
          },
        }
      }),
     
      new CssMinimizerPlugin(),
    ],

    splitChunks: {
      chunks: 'all',
      name: false,
    },

    runtimeChunk: {
      name: entrypoint => `runtime-${entrypoint.name}`,
    },
  }
}