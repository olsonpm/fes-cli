const path = require('path'),
  TerserPlugin = require('terser-webpack-plugin')

const fesCliRoot = path.resolve(__dirname, '../../')

module.exports = projectRootPath => ({
  mode: 'production',
  context: projectRootPath,
  entry: './index.js',
  devtool: 'source-map',
  output: {
    filename: 'index.pack.min.js',
    globalObject: "typeof self !== 'undefined' ? self : this",
    library: 'fes',
    libraryTarget: 'umd',
    path: projectRootPath,
  },
  optimization: {
    minimizer: [new TerserPlugin({ sourceMap: true })],
  },
  resolveLoader: {
    modules: [path.resolve(fesCliRoot, 'node_modules')],
    extensions: ['.js', '.json'],
    mainFields: ['loader', 'main'],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: false,
            //
            // why require.resolve?
            // https://github.com/babel/babel-loader/issues/299#issuecomment-259713477
            //
            presets: ['@babel/preset-env'].map(require.resolve),
          },
        },
      },
    ],
  },
})
