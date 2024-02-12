const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CompressionPlugin = require("compression-webpack-plugin");

module.exports = {
  devServer: {
    host: "0.0.0.0",
    port: '8088',
    historyApiFallback: true
  },
  entry: './src/ts/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[chunkhash].js',
    publicPath: '/',
    libraryTarget: 'umd',
    environment: {
      arrowFunction: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env',
                  {
                    targets: {
                      chrome: '58',
                      ie: '11',
                    },
                    corejs: '3',
                    useBuiltIns: 'usage',
                  },
                ],
              ],
            },
          },
          'ts-loader',
        ],
        exclude: /node-modules/,
      },

      {
        test: /\.(css|scss|sass)$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
      },

      {
        test: /\.(glsl|vs|fs)$/,
        loader: 'ts-shader-loader',
      },
    ],
  },

  plugins: [
    new CompressionPlugin(),

    new MiniCssExtractPlugin({
      filename: "bundle.[contenthash].css",
    }),

    new HTMLWebpackPlugin({
      template: './src/index.html',
    }),

    new CopyWebpackPlugin({
      patterns: [{ from: path.resolve(__dirname, './static') }],
    }),

    new ESLintPlugin({
      context: './src',
      extensions: ['js', 'jsx', 'ts'],
    }),
  ],
  resolve: {
    extensions: ['.ts', '.js'],
  },
  performance: {
    hints: false,
  },
}
