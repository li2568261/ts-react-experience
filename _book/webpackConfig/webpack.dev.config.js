const merge = require('webpack-merge');
const baseConfig = require('./webpack.base.config');
const vConsolePlugin = require('vconsole-webpack-plugin'); 
const HotModuleWebpackPlugin = require('webpack').HotModuleReplacementPlugin;
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const {
    pathResolve,
    styleLoaderGenerator,
    tsLoaderGenerator
} = require('./utils');
const theme = require(pathResolve('theme'));

const config = {
    module: {
        rules: [
            tsLoaderGenerator(),
            styleLoaderGenerator('scss', {}),
            styleLoaderGenerator('less', {
                modifyVars: theme,
                javascriptEnabled: true,
            }),
            styleLoaderGenerator('css')
        ]
    },
    devServer: {
        hot: true,
        disableHostCheck: true,
        host: '0.0.0.0',
        port: 8081,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, x-id, Content-Length, X-Requested-With",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
        },
    },
    plugins:[
        new ForkTsCheckerWebpackPlugin(),
        new vConsolePlugin({enable: false}),
        new HotModuleWebpackPlugin()
    ]
};

module.exports = merge(baseConfig, config);
