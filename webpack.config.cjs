const TerserPlugin = require("terser-webpack-plugin")
const webpack = require('webpack')

module.exports = {
    mode: "production",
    devtool: "source-map",
    entry: {
        "clientApi": "./src/core/api/clientApi.ts"
    },

    output:{
        path: __dirname + '/dist/core/api',
        filename: '[name].js',
    },

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts"],
        extensionAlias: {
            '.js': ['.tsx','.ts', '.js']
        },
        alias: {
            '~': '/src'
        }
    },

    plugins:[
        new webpack.NormalModuleReplacementPlugin(
            /adapters|PiziServerApi|restRouter/,
            '~/mock.ts'
          )
    ],

    module: {
        rules: [
            {
                test: /\.ts(x?)$/,
                exclude: ["/src/core/models", "/node_modules"],
                use: [
                    {
                        loader: "ts-loader",
                        options: {
                            allowTsInNodeModules: true,
                            configFile: 'tsconfig.prod.json'
                        }
                    }
                ]
            }
        ]
    },
    optimization: {
        minimizer: [
          new TerserPlugin()
        ]
    }
}