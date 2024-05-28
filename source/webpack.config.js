/* eslint-disable prettier/prettier */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: './src/main.js',
  output: {
      path: path.join(__dirname, './dist'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['babel-loader'],
        exclude: /node_modules/,
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Test Webpack',
      template: './index.html',
      filename: 'template.html'
    })
  ]
}
