const HtmlWebpackPlugin = require('html-webpack-plugin');
const AutoDllPlugin = require('autodll-webpack-plugin');
const { DefinePlugin } = require('webpack');
const { pathResolve } = require('./utils');
const argv = require('yargs').argv;
console.log(process.argv);
const baseConfig = {
  entry: {
    app: pathResolve('src/main')
  },
  output: {
    path: pathResolve('dist'),
    filename: 'js/[name].js'
  },
  module: {
    rules:[
      {
        test: /\.(png|jpg|jpeg|gif)$/,
        loader: 'url-loader',
        options: {
          limit: 1,
          name: '[name].[ext]',
          outputPath: 'images/',
        }
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      "@components": pathResolve("src/components"),
      "@utils": pathResolve("src/utils"),
      "@view": pathResolve("src/view"),
      "@styles": pathResolve("src/styles"),
      "@assets": pathResolve("src/assets"),
      "@api": pathResolve("src/api"),
      "@store": pathResolve("src/store"),
      "@decorators": pathResolve("src/decorators"),
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      template: pathResolve('build/tmp/index.html')
    }),
    new AutoDllPlugin({
      inject: true, // will inject the DLL bundle to index.html
      debug: true,
      filename: '[name]_[hash].js',
      path: './dll',
      entry: {
        vendor: [
          'react',
          'react-dom',
          'react-router-dom',
          'axios',
          'jQuery'
        ]
      }
    }),
    new DefinePlugin({
      "CURRENT_ENV": argv.apimode ? JSON.stringify(argv.apimode) : JSON.stringify('test')
    })
  ]
}

module.exports = baseConfig;