module.exports = function (api) {
  api.cache(true);

  let presets =
    [ '@babel/typescript'
    , [ '@babel/preset-react', {
        "runtime": "automatic"
      }]
    , [ '@babel/preset-env'
      , {
          "targets": "last 2 versions",
          "exclude": ["@babel/plugin-transform-regenerator"]
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
