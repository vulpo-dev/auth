module.exports = function (api) {
  api.cache(true);

  let presets =
    [ '@babel/typescript'
    , [ '@babel/preset-react', {
        "runtime": "automatic"
      }]
    , [ '@babel/preset-env'
      , {
          "targets": "last 2 versions"
        }
      ]
    ]

  let plugins = 
    [ 'babel-plugin-styled-components'
    , "@babel/plugin-proposal-class-properties"
    ]

  return {
    presets,
    plugins
  }
}
