let path = require('path');
let cwd = process.cwd();
let src = path.resolve(cwd, 'src');
module.exports = {
  core: {},
  "stories": ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  "addons": ["@storybook/addon-links", "@storybook/addon-essentials"],
  webpackFinal: async (config, {
    configType
  }) => {
    config.resolve.modules = [src, ...(config.resolve.modules ? config.resolve.modules : [])];
    return config;
  },
  framework: {
    name: "@storybook/react-webpack5",
    options: {}
  },
  docsPage: {
    docs: "automatic"
  }
};