const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { ProgressPlugin } = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

function getWebpackConfig(entry, output, progressStreamCallback) {
    const isProduction = true; // Since you hardcoded mode: 'production', we assume true
    const userSourcePath = path.join(process.cwd(), process.env.PROJECT_FILE_DEST, entry);
    const globPath = userSourcePath.replace(/\\/g, '/') + "/**/*.{js,jsx,ts,tsx,html}";


    const config = {
        mode: "production",
        entry: [
            path.join(process.cwd(), process.env.PROJECT_FILE_DEST, entry, "index.jsx")
        ],
        output: {
            path: path.join(process.cwd(), process.env.BUNDLED_PROJECT_DEST, output),
            // [contenthash] ensures that if code changes, the filename changes (prevents caching issues)
            filename: '[name].[contenthash].bundle.js',
            assetModuleFilename: 'assets/[hash][ext][query]',
            clean: true, // Native Webpack 5 alternative to CleanWebpackPlugin (optional, but good practice)
        },
        resolve: {
            // Allows importing modules without specifying extensions
            extensions: ['.tsx', '.ts', '.js', '.jsx', '.json'],
        },
        module: {
            rules: [
                // 1. Javascript & React (Babel)
                {
                    test: /\.(js|jsx)$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                '@babel/preset-env',
                                ['@babel/preset-react', { runtime: 'automatic' }] // 'automatic' allows using JSX without importing React
                            ]
                        }
                    }
                },
                // 2. TypeScript
                {
                    test: /\.ts(x)?$/,
                    loader: 'ts-loader',
                    exclude: /node_modules/
                },
                // 3. CSS & Tailwind
                // Replaced style-loader with MiniCssExtractPlugin to generate real CSS files
                {
                    test: /\.css$/,
                    include: userSourcePath, // Only process CSS in the user's folder
                    use: [
                        MiniCssExtractPlugin.loader,
                        'css-loader',
                        // {
                        //     loader: 'postcss-loader',
                        //     options: {
                        //         postcssOptions: {
                        //             plugins: [
                        //                 // 1. Configure Tailwind Programmatically
                        //                 require('tailwindcss')({
                        //                     content: [
                        //                         // CRITICAL: We tell Tailwind to scan files inside this specific user's folder
                        //                         path.join(userSourcePath, "**/*.{js,jsx,ts,tsx,html}")
                        //                     ],
                        //                     theme: {
                        //                         extend: {},
                        //                     },
                        //                     plugins: [],
                        //                 }),
                        //                 // 2. Add Autoprefixer
                        //                 require('autoprefixer')
                        //             ],
                        //         },
                        //     },
                        // },
                        {
                            loader: 'postcss-loader',
                            options: {
                                postcssOptions: {
                                    plugins: [
                                        require('tailwindcss')({
                                            content: [globPath], // Use the normalized path
                                            theme: { extend: {} },
                                            plugins: [],
                                        }),
                                        require('autoprefixer')
                                    ],
                                },
                            },
                        },
                    ]
                },
                // 4. Assets (Images, Fonts, SVGs) - Webpack 5 Native Support
                {
                    test: /\.(png|jpg|jpeg|gif)$/i,
                    type: 'asset/resource', // Copies file to output folder
                },
                {
                    test: /\.svg$/,
                    type: 'asset/inline', // Inlines SVG as base64 (good for icons) - change to 'asset/resource' if SVGs are large
                },
                {
                    test: /\.(woff|woff2|eot|ttf|otf)$/i,
                    type: 'asset/resource',
                },
            ]
        },
        plugins: [
            // Extracts CSS into a separate file
            new MiniCssExtractPlugin({
                filename: '[name].[contenthash].css',
            }),
            new HtmlWebpackPlugin({
                inject: true, // Automatically injects <script> and <link> tags
                minify: {
                    removeComments: true,
                    collapseWhitespace: true,
                    removeRedundantAttributes: true,
                    useShortDoctype: true,
                    removeEmptyAttributes: true,
                    removeStyleLinkTypeAttributes: true,
                    keepClosingSlash: true,
                    minifyJS: true,
                    minifyCSS: true,
                    minifyURLs: true,
                },
                templateContent: `
              <!DOCTYPE html>
              <html lang="en">
              <base href="${process.env.BACKEND_DOMAIN ? "https://" + process.env.BACKEND_DOMAIN : "https://localhost"}:3005/bundle/${output}/">
              <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Folio</title>
                  <!-- CSS links will be auto-injected here by Webpack -->
              </head>
              <body>
                  <div id="userPageRoot"></div>
                  <!-- JS scripts will be auto-injected here by Webpack -->
              </body>
              </html>
            `
            }),
            new CleanWebpackPlugin(),
            new ProgressPlugin({
                activeModules: false,
                entries: true,
                handler(percentage, message, ...args) {
                    if (progressStreamCallback) {
                        progressStreamCallback({ percentage, message, ...args });
                    }
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
            minimize: true,
            minimizer: [
                new TerserPlugin(), // Minify JavaScript
                new CssMinimizerPlugin(), // Minify CSS
            ],
            runtimeChunk: 'single', // Helps with long-term caching
            splitChunks: {
                chunks: 'all', // Optimization: Split vendor code from app code
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all',
                    },
                },
            },
        },
    };

    return config;
}

module.exports = { getWebpackConfig };