module.exports = function (api) {
  api.cache(true);

  let presets =
    [ '@babel/typescript'
    , ['@babel/preset-react', { 'development': true }]
    , '@babel/preset-env'
    ]

  let plugins = 
    [ 'babel-plugin-styled-components'
    ]

  return {
    presets,
    plugins
  }
}
