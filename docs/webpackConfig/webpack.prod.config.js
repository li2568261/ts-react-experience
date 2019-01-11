const merge = require('webpack-merge');
const baseConfig = require('./webpack.base.config');
const vConsolePlugin = require('vconsole-webpack-plugin'); 
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const argv = require('yargs').argv;

const {
    pathResolve,
    styleLoaderGenerator,
    tsLoaderGenerator
} = require('./utils');
const theme = require(pathResolve('theme'));

const plugins = [
    new MiniCssExtractPlugin({
        filename: 'css/[name].css'
    })
];
const cssBuildConf = {
    isbuild: true,
    postcss: true
};

if(argv.apimode !== 'online'){
    plugins.push(new vConsolePlugin({enable: true}))
}


const config = {
    output:{
        publicPath: '/website/assets/zaapp/dm-other/creditMall/'
    },
    module: {
        rules: [
            tsLoaderGenerator({
                cache: false,
                hot: false
            }),
            styleLoaderGenerator('scss', {}, cssBuildConf),
            styleLoaderGenerator('less', {
                modifyVars: theme,
                javascriptEnabled: true,
            }, cssBuildConf),
            styleLoaderGenerator('css', undefined , cssBuildConf)
        ]
    },
    plugins,
    optimization: {
        minimizer: [
            new UglifyJsPlugin({
                cache: true,
                parallel: true
            }),
            new OptimizeCssAssetsPlugin({
                cssProcessor: require('cssnano'),
                cssProcessorOptions: {
                    reduceIdents: false,
                    autoperfixer: false
                }
            })
        ]
    }
};

module.exports = merge(baseConfig, config);
