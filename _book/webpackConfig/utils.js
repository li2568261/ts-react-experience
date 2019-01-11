const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const tsImportPortPlugin = require('ts-import-plugin');


const pathResolve = (...arg) => {
  return path.resolve(__dirname, '../', ...arg);
}

const moduleCssLoaderConfGenerator = regstr => ({
  loader: 'typings-for-css-modules-loader',
  options: {
    modules: true,
    namedExport: true,
    camelCase: true,
    [regstr]: true
  }
});

const styleLoaderGenerator = (regstr, loaderOption = {}, {
  isModule = false,
  isbuild = false,
  postcss = false,
  otherConfig = {}
} = {}) => {

  const use = [
    isbuild ? MiniCssExtractPlugin.loader : 'style-loader',
    {
      loader: 'cache-loader',
      options: {
        cacheDirectory: pathResolve('.cache-loader')
      }
    },
    isModule ? moduleCssLoaderConfGenerator(regstr) : 'css-loader'
  ];
  postcss && use.push('postcss-loader');
  regstr !== 'css' && use.push({
    loader: `${regstr == 'scss' ? 'sass' : regstr}-loader`,
    options: loaderOption
  });
  return Object.assign({
    test: new RegExp(`\\.${regstr}\$`),
    use,
  }, otherConfig)
}

const tsLoaderGenerator = ({
  cache = true,
  hot = true
} = {}) => {
  const options = {
    getCustomTransformers: () => ({
      before: [
        tsImportPortPlugin({
          libraryName: 'antd-mobile',
          libraryDirectory: 'lib',
          style: true
        })
      ]
    })
  };

  if (cache) {
    Object.assign(options, {
      useCache: true,
      cacheDirectory: pathResolve('.cache-loader'),
    })
  }
  if (hot) {
    Object.assign(options, {
      babelOptions: {
        babelrc: false,
        plugins: [
          'react-hot-loader/babel'
        ]
      }
    })
  }
  return {
    test: /\.tsx?$/,
    include: [pathResolve('src')],
    use: [{
      loader: 'awesome-typescript-loader',
      options
    }]
  }
}
module.exports = {
  pathResolve,
  styleLoaderGenerator,
  tsLoaderGenerator
}