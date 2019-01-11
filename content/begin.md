# 起手式

## 前言

> **typescript**（以下简称ts） 官推是脚手架 **create-react-app** 的[ts版本](https://github.com/Microsoft/TypeScript-React-Starter#typescript-react-starter),可自行查阅。但是我没有用它，原因有2：
>
> 1. Webpack 版本是3.x，在组内用过4.x重构脚手架之后之后不想再回头配3.x。
> 2. 作为学习项目以及教程，方便贯穿整个项目构建流程。

> 接下来将分别从一些用到的tsconfig、webpack配置展开来讲解



## ts配置

#### 编译器安装

 ts 作为 js 的方言要编译成 js 需要编译器安装（相关参考[5分钟上手TypeScript](https://www.tslang.cn/docs/handbook/typescript-in-5-minutes.html)）

```javascript
npm install -g typescript
```

编译代码当然也就是:

```javascript
tsc 文件名.ts
```

最终默认会在当前目录下生产一个js文件，就是编译后的代码了。

既然有默认那就有自定义配置，如何做呢？

#### Ts自定义配置

自定义配置有两种方式：

1. 在命令行后加相应配置参数例如你不想将以下代码编译成es5的函数形式（配置参考链接：[compiler-options](https://www.tslang.cn/docs/handbook/compiler-options.html)）

   ```bash
   const fuc = ()=>{
     console.log(1);
   }
   fuc();
   ```

   你可以

   ```bash
   tsc 文件名.ts --target es6
   ```

   如果需要多个配置，继续往后写即可，这里就不详述了。

2. 第一种方式如果参数多了看上去很难受，这里我推荐第二种方式：在项目跟目录新建tsconfig.json文件，我推荐在方法1文档上找到一个配置参数**--init**初始化tsconfig.json（参考链接：[tsconfig.json](https://www.tslang.cn/docs/handbook/tsconfig-json.html)）。

   ```bash
   tsc --init
   ```

   这里我列举几个用到的属性

   ```json
   {
     "compilerOptions": {
       "target": "es5", // 你最终编译成js模型
       "lib":[
         "es2017",
         "dom"
       ],// 你使用的一些库，你可以理解成ts的一些polyfill
       "module": "ESNext", // 你编译后的代码的模式，amd umd esmodule...等等下面详述
       "jsx": "react", // jsx 语法糖用哪个
       "allowJs": true, // 是否允许引入js
       "checkJs": true, // 是否检测js文件类型
       "paths": {
         "@components/*": ["./src/components/*"],
         "@utils/*": ["./src/utils/*"],
         "@view/*": ["./src/view/*"],
         "@styles/*": ["./src/styles/*"],
         "@api/*": ["./src/api/*"],
         "@store/*": ["./src/store/*"],
         "@decorators/*": ["./src/decorators/*"],
         "@assets/*": ["./src/assets/*"],
       },// 别名
       "strict": true, //严格模式
       "moduleResolution": "node", // 直接看这个吧https://www.tslang.cn/docs/handbook/module-resolution.html
       "baseUrl": ".", // 配合paths,当符合 paths 规则的文件引入，会采用baseUrl+相应数组列表下查找的方式去找相应文件
       // "esModuleInterop": true,  // 作用是让commonjs/esmodule两种模块模式正常通信（具体看下一节），作用同下，如果使用了es7相关polyfill不可用会报错（不确定，个人经验）。   
       "allowSyntheticDefaultImports": true, // 往下看模块机制
       "experimentalDecorators": true, // 使用装饰器
       "rootDir": "./src", // 运行tsc命令时去编译哪个目录下的文件配合webpack可以不设置
       "outDir": "./dist"	// 同样，其实这个也可以不设置，但是如果不设置你要给js文件写d.ts（后文会讲到）这里会报一个overWrite的错，作为强迫症就设置一下吧。
     },
     "include": [
       "src/**/*"
     ], // tsc 会编译在->rootDir<-内哪些文件
     "exclude": [
       "node_modules",
       "dist",
       "build"
     ] // tsc 不会编译->rootDir<-内的哪些文件
   }
   ```

   Ps:文件新建好了之后如果要编译当前子文件夹,配置是无效的:

   ```bash
   tsc ./sub/文件名.ts # 配置无效还是默认配置
   ```


#### 模块转化

通过编译后的几种模块模式来帮助理解`module`和`esModuleInterop`、`allowSyntheticDefaultImports`配置项；

```javascript
// 原始代码
const fuc = ()=>{
  console.log(1);
}
export default fuc();
// commonjs
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fuc = function () {
    console.log(1);
};
exports.default = fuc();
// amd
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var fuc = function () {
        console.log(1);
    };
    exports.default = fuc();
});
```



原始代码在 `commonjs` 和 `amd` 导出的数据格式其实是这样子的（如果不知道`defineProperty`可以查下mdn）：

```javascript
{
    __esModule: true,
        default:fuc()
}
```

当在某处遇到一行代码引用了

```javascript
import fuc from '这个地址';
console.log(fuc);
```

当我们加上`esModuleInterop`或`allowSyntheticDefaultImports`它会被编译成

```javascript
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var complie_1 = __importDefault(require("./complie"));
console.log(complie_1.default);

```

`require("./complie")` 这玩意儿就是上面说的那个对象

然后来分析 `__importDefault`，首先会识别`__esModule`变量，如果为`true`，直接把当前模块作为导出，否则导出一个对象，对象的default是导出的模块。

当我们不加上面那两个选项的时候编译成

```javascript
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var complie_1 = require("./complie");
console.log(complie_1.default);
```

小结一下：`import variable from 'xx'` variable 会被转成 variable.default；如果配置了`esModuleInterop`或`allowSyntheticDefaultImports`，如果`import`的是`esmodule`直接采用当前模块，否则把当前模块放到一个含`default`的对象中去，default的值就是当前模块。

OK，接下来我们来解释这两个属性的意义,引入`@types/react/index.d.ts`一段代码（d.ts是啥之后再探讨）

```javascript
export = React;
export as namespace React;
```

我们发现没有默认值导出值，但是我们想`import React from 'react'`这种操作就会报错，OK结论就是这两句话，但是过程。。很曲折。

再看下另外一种引入和导出方式会如何转换

```javascript
// module x
export const a = 1;
export const b = 1;
export const c = 1;
export const d = 1;
export default 10;
// module import module x
import * as all from 'x';
console.log(all)

// 转化过后
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.a = 1;
exports.b = 1;
exports.c = 1;
exports.d = 1;
exports.default = 10;

//----------------------------------

var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var all = __importStar(require("x"));
console.log(all);
```

同样esModule原样导出，否则取当前对象上的属性导出（剔除原型链上的属性）;这里引入的变量**不会**被处理成`all.default`;



### webpack配置

我眼中的`webpack`他是一个资源整合工具，经过：资源->入口->loader + plugin->output这样一个过程，进行策略整合。本小结不详细讲解配置过程，只是描述下配置思路，具体配置项可点我查看。

首先我们给自己定一个**小目标**~~赚他一个亿，别走错片场了~~，我们的项目需要：

1. 能解析 ts|tsx 文件；
2. 能用scss/less文件;
3. 能跟根据不同命令，打包/运行不同运行环境下的代码；
4. 能热更新；
5. 移动端线真机调试需要vconsole，但也受命令控制是否引入；
6. import('xx')实现模块切割，异步加载模块；
7. 公用库的只想构建一次；
8. 构建后的代码，样式我想`autoprefixer`并额外导出，js我想压缩；
9. 我想引入antd-mobile并能按需引入模块；

接下来我们一个一个实现这些小目标:

1. 官推两个loader：ts-loader/aweasome-typescript-loader，他们都会根据你项目根目录下的tsconfig.json进行解析。
2. 配置scss-loader/less-loader
3. 在package.json中的scripts项分别新增相应参数的命令，可以通过yargs这个库去拿相应的参数通过DefinePlugin去修改方法体上的代码。
4. 那就是配置devServer配置项嘛，当然别忘了加入入HotModuleWebpackPlugin。react的热更新需要react-hot-loader除了基础配置以外还需要一个ForkTsCheckerWebpackPlugin插件。
5. vconsole-webpack-plugin
6. 啥也不用干，ts已经处理好了
7. dll？？我要更简单一点，用AutoDllPlugin。
8. postcss 配下这个插件
9. ts-import-plugin

具体过程我就不详述了如果你想看[demo就点我吧](https://github.com/li2568261/ts-readux-experience/tree/master/webpackConfig)