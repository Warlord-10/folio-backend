const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  module: {
    rules: [
      {
        test: /\.svg$/,
        use: "svg-inline-loader",
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(jsx|js)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: "defaults" }],
              '@babel/preset-react'
            ]
          }
        }
      },
    ],
  },
  output: {
    filename: "bundle.js",
    libraryTarget: 'umd',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "template.html"
    })
  ],
  mode: "development",
};