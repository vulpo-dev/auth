let path = require('path');
let cwd = process.cwd();
let src = path.resolve(cwd, 'src');
module.exports = {
  core: {},
  'stories': ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  webpackFinal: async (config, {
    configType
  }) => {
    // `configType` has a value of 'DEVELOPMENT' or 'PRODUCTION'
    // You can change the configuration based on that.
    // 'PRODUCTION' is used when building the static version of storybook.

    // Make whatever fine-grained changes you need
    config.resolve.modules = [src, 'node_modules'];
    config.resolve.alias = {
      react: path.resolve('./node_modules/react'),
      'styled-components': path.resolve('./node_modules/styled-components'),
      'react-router-dom': path.resolve('./node_modules/react-router-dom'),
      'i18next': path.resolve('./node_modules/i18next'),
      'react-i18next': path.resolve('./node_modules/react-i18next')
    };

    // Return the altered config
    return config;
  },
  framework: {
    name: '@storybook/react-webpack5',
    options: {}
  },
  docsPage: {
    docs: 'automatic'
  }
};