# typescript

文档太无趣，我们就来讲个故事尝试着贯穿ts的知识点吧。

## part1-讲个故事

从前有座山，山里有座庙，据说还有只大脑腐，还有一些其他什么的

```typescript
interface IMountain{
    temple: Temple // 寺庙
    tiger?: Tiger // 脑腐
    [other: string]: any // 有点其他什么的
}
```

庙里有个老方丈和很多个小和尚，养了一些鸡啊鸭啊（就不说还有其他什么的）

```typescript
interface ITemple {
	holder: Holder // 老住持
    monk: Monck[] // 小和尚
    poultry: (ChickeC | Duck)[] // 鸡鸭
}
```

描述完了之后我们开始实现

```typescript
// 脑腐、鸭子、鸡、人都属于动物，我们建个虚拟基类，不让他实例化。
abstract class Animal{
  mouse = 1 // 一张嘴
  leg = 2 // 两条腿
  protected voice(content:string){ console.log(content) }
}
// 鸭子是呱呱叫
class Duck extends Animal{
  quack(){ this.voice('quack') }
}
// 鸡是咯咯哒
class Chicke extends Animal{
  crow(){ this.voice('gegeda') }
}
// 脑腐是嗷呜而且是四条腿
class Tiger extends Animal{
  leg = 4
  howl(){ this.voice('howl') }
}
```

我灵机一动想让他变成一只强鸡建议阅读顺序1、2、3、4

```typescript
// 3、定义一个构造函数类型，一下两者都可以
type ConstructorFuc<T> = new (...arg:any[])=>T;
interface IConstructorFuc<T>{
  new (...arg:any[]):T;
}

// 4、这个是鸡特有的属性
interface IChicke{
  crow():void
};
// 2、构建这个装饰器，装饰器接收一个构造函数作为方法，定义返回类型是鸡。
const strong = (ctor:ConstructorFuc<Animal & IChicke>)=>{
  return class extends ctor{
    crow(){
      super.crow();
      super.crow();
    }
  }
}
// 1、这里用装饰器加强鸡
@strong
class Chicke extends Animal{
  crow(){ this.voice('gegeda') }
}
```

下面我们来让他展示下自己吧

```typescript
const tiger = new Tiger();
tiger.howl()// howl
const duck = new Duck();
duck.quack()// quack
const chicke = new Chicke();
chicke.crow();// gegeda gegeda
```

可以看到鸡比较牛皮，叫了两声。

下面我们来创建人物，给他多添加姓名这个属性，发出声音的方式就是speak了。

```typescript
interface IPeople{
  name: string
  speak(content: string):void
}
```

接下来是小和尚，小和尚难免会有个小秘密，一般不会轻易被人知道，但是总得有让人知道的方法。

```typescript
class Monck extends AbsAnimal{
  name: string;
  private secret = '讲出自己的小秘密';
  speackSecret(){
    this.speak(this.secret);
  }
  constructor(param: Pick<IPeople, 'name'>){
    super();
    this.name = param.name;
  }
  speak(content:string){
    super.voice(`${this.name}:${content}`)
  }
}
```

众所周知，住持同学需要由小和尚成长而来,作为住持同学，可以命令小和尚做自己能完成的事情，而且自己的名称上冠上一个title。

```typescript
class Holder extends Monck{
  constructor(param: Pick<IPeople, 'name'>){
    super(param);
    this.name = param.name+`(住持)`;
  }
  command(monck:Monck, something: keyof Monck){
    if(typeof monck[something] === 'function'){
      console.log(`${this.name} 命令 ${monck.name} 去干 ${something}`);
      (monck[something] as Function)();
    }
    console.log(`${monck.name} 干不了 ${something}`);
  }
}
```

接下来，方丈同学要求小和尚说出自己的秘密

```typescript
const holder = new Holder({ name: '鸠摩智' });
const monck = new Monck({ name: '虚竹'});

holder.command(monck, 'speackSecret');
//  鸠摩智(住持) 命令 虚竹 去干 speackSecret
//  虚竹:讲出自己的小秘密
```

我们让他们都住进寺庙里

```typescript
const temple:ITemple = {
  holder,
  monks:[monk],
  poultry: [duck, chicke]
}
```

寺庙放进山里，并有一只来去自如的脑腐

```typescript
const isTigerMountain = (mountain: IMountain)=>{
  console.log(`这${mountain.tiger ? '是' : '不是'}一座脑腐山`)
}
const mountain: IMountain = {
  temple
}
isTigerMountain(mountain);
mountain.tiger = tiger;
isTigerMountain(mountain);
Array().fill(6).forEach(data=>{
  (mountain.tiger as Tiger).howl()// aowu * 6
})
mountain.tiger = undefined;
isTigerMountain(mountain);
```



## part2-d.ts文件

`d.ts`，`declare`文件，定义文件，里面内容只能包含一些定义，主要用法有以下。

1. 声明单个 js 文件

当 ts 需要引入 js 相关文件时，比如我有一个js文件，引入会报错

```typescript
// speak.js
export const leeSpeak = (word)=>{
  console.log(word);
};
// other.js
import speck from './speak';// Could not find a declaration file for module './speak'.
speck.leeSpeak();
```

解决方式是在`speck.js`同级目录下新建一个同名的d.ts文件：

```typescript
// speck.js
export const leeSpeak: (word:string)=>void;
```

这种方式有个问题就是，在运行 tsc 时，js文件不会导出到dist相关目录( 在webpack下没关系 )。

当然你也可以启动 allowjs，但是不要开checkjs，因为js无法进行类型定义，而checkjs会按照ts进行语法检查，如果正常的js语法不能被编译器推断容易产生报错。

2. 全局声明变量 / 类型

编码过程中咱们可能通过1、 webpack 的 externals属性 或者 webpackDllPlugin 引入一些包；2、 DefinePlugin 定义一些变量；3、node_module 中 @types 文件夹下没有相应生命文件包；为了让他们能够正常使用，我们需要定义相应的类型。

```typescript
// webpack.base.js
new DefinePlugin({
  "CURRENT_ENV": 'test'
})

// xx.d.ts
declare namespace lee{
    const name: string
}
declare module 'zhang'{
    const name: string
}
declare const CURRENT_ENV : 'test'
// xx.js
import zhang from 'zhang';
zhang.name
lee.name
CURRENT_ENV

```

全局包声明不能使用 export、import 进行模块引入和导出。

ps： 咱们编码的过程中咱们还会遇到一种情况，就是 node_modules @types 下有相应的模块化声明文件，但是我们想置于全局，举例react。

```typescript
// 通常情况下使用react
// 但是所有页面都引入不免有些麻烦
import React from 'react';


// global.d.ts
declare global{
    const React: typeof import("react");
}
export {}
```

typescript的一些常见问题就说到这里啦。