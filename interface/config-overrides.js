const webpack = require('webpack')
const path = require('path')

const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = function override(config) {
  // 1. Polyfills for Node.js globals that Web3Auth dependencies need
  config.plugins = (config.plugins || []).concat([
    new NodePolyfillPlugin(), // auto polyfills many node modules
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ])

  // 2. Fix the node_modules babel-loader.
  //    CRA 4's "dependencies" preset only does ESM→CJS — it does NOT transform
  //    optional chaining (?.), nullish coalescing (??), class fields, etc.
  //    Webpack 4's acorn parser can't handle these either.
  //    Fix: inject the missing transform plugins into the node_modules loader.
  var oneOfRules = config.module.rules.find(function (rule) { return rule.oneOf }).oneOf

  var nodeModulesBabelRule = oneOfRules.find(function (rule) {
    return rule.loader &&
      rule.loader.includes('babel-loader') &&
      rule.exclude
  })

  if (nodeModulesBabelRule) {
    var existingOptions = nodeModulesBabelRule.options || {}
    var extraPlugins = [
      require.resolve('@babel/plugin-proposal-optional-chaining'),
      require.resolve('@babel/plugin-proposal-nullish-coalescing-operator'),
      [require.resolve('@babel/plugin-proposal-class-properties'), { loose: true }],
      [require.resolve('@babel/plugin-proposal-private-methods'), { loose: true }],
      [require.resolve('@babel/plugin-transform-private-property-in-object'), { loose: true }],
    ]

    // Ensure .cjs in node_modules is transpiled by this dependencies babel-loader.
    nodeModulesBabelRule.test = /\.(js|mjs|cjs)$/
    existingOptions.plugins = (existingOptions.plugins || []).concat(extraPlugins)
    nodeModulesBabelRule.options = existingOptions
  }

  // 3. Aliases for node built-in polyfills
  config.resolve = config.resolve || {}
  config.resolve.alias = Object.assign({}, config.resolve.alias || {}, {
    stream: require.resolve('stream-browserify'),
    crypto: require.resolve('crypto-browserify'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    os: require.resolve('os-browserify/browser'),
    assert: require.resolve('assert'),
  })

  // 4. Shim react-dom/client for React 17 — Web3Auth v8 UI uses createRoot
  config.resolve.alias['react-dom/client'] = path.resolve(__dirname, 'src/shims/react-dom-client.js')

  // 5. Handle .mjs files from @metamask/* packages.
  //    @web3auth/ethereum-provider pulls in @metamask/eth-sig-util → @metamask/utils
  //    which ships .mjs files. Webpack 4 can't bridge ESM↔CJS named imports,
  //    so we force CJS resolution and treat .mjs files as regular JS.
  config.module.rules.push({
    test: /\.mjs$/,
    include: /node_modules/,
    type: 'javascript/auto',
  })

  // Force @metamask packages to CJS entry points (avoid ESM .mjs resolution via module field)
  config.resolve.alias['@metamask/superstruct'] = require.resolve('@metamask/superstruct')
  config.resolve.alias['@metamask/utils'] = require.resolve('@metamask/utils')

  return config
}
