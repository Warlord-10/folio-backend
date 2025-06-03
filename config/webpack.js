const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { ProgressPlugin } = require('webpack');

function getWebpackConfig(entry, output, progressStreamCallback){
    const config = {
        entry: [
            path.join(process.cwd(), process.env.PROJECT_FILE_DEST, entry, "index.jsx")
        ],
        output: {
            path: path.join(process.cwd(), process.env.BUNDLED_PROJECT_DEST, output),
            filename: '[name].bundle.js'
        },
        module: {
            rules: [
                {
                    test: /\.(js|jsx)$/,
                    use: 'babel-loader',
                    exclude: /node_modules/
                },
                {
                    test: /\.css$/,
                    include: path.join(process.cwd(), process.env.PROJECT_FILE_DEST, entry),
                    use: [
                        'style-loader',
                        {
                            loader: 'css-loader',
                            options: {
                                importLoaders: 1
                            }
                        },
                        'postcss-loader'
                    ]
                },
                {
                    test: /\.ts(x)?$/,
                    loader: 'ts-loader',
                    exclude: /node_modules/
                },
                {
                    test: /\.svg$/,
                    use: 'file-loader'
                },
                {
                    test: /\.png$/,
                    use: [
                        {
                            loader: 'url-loader',
                            options: {
                                mimetype: 'image/png'
                            }
                        }
                    ]
                }
            ]
        },
        // devServer: {
        //   'static': {
        //     directory: './dist'
        //   }
        // },
        // resolve: {
        //   extensions: [
        //     '.tsx',
        //     '.ts',
        //     '.js'
        //   ],
        //   alias: {
        //     'react-dom': '@hot-loader/react-dom'
        //   }
        // },
        plugins: [
            new HtmlWebpackPlugin({
                // template: "template.html",
                templateContent: `
              <!DOCTYPE html>
              <html lang="en">
              <base href="${process.env.BACKEND_DOMAIN ? "https://" + process.env.BACKEND_DOMAIN : "http://localhost"}:3005/bundle/${output}/">
              <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Folio</title>
              </head>
    
              <body>
                  <div id="userPageRoot"></div>
              </body>
    
              </html>
            `
            }),
            new CleanWebpackPlugin(),
            new ProgressPlugin({
                activeModules: false,
                entries: true,
                handler(percentage, message, ...args) {
                    progressStreamCallback({percentage, message, ...args})
                },
                modules: true,
                modulesCount: 0,
                profile: false,
                dependencies: true,
                dependenciesCount: 0,
                percentBy: null,
            })
        ],
        optimization: {
            runtimeChunk: 'single',
            splitChunks: {
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all'
                    }
                }
            }
        },
        mode: "production",
    };

    return config;
}

module.exports = {getWebpackConfig};