const webpack = require('webpack');

module.exports = {
  // Other webpack configuration...
  
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
        exclude: /node_modules\/react-zoom-pan-pinch/, // Exclude this package
      },
    ],
  },

  plugins: [
    new webpack.IgnorePlugin({
      resourceRegExp: /react-zoom-pan-pinch/, // Ignore warnings from this package
    }),
  ],

  stats: {
    warningsFilter: /Failed to parse source map/, // Suppress this specific warning
  },
}