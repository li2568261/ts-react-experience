## 深度剖析 redux applyMiddleware 中 compose 构建异步数据流的思路


### 前言
> 本文作者站在自己的角度~~深入浅出...算了别这么装逼~~分析 ```redux applyMiddleware``` 在设计过程中通过 ```compose``` 构建异步数据流的思路。自己假设的一些场景帮助理解，希望大家在有异步数据流并且使用redux的过程中能够有自己的思路（脱离```thunk or saga```）构建自己的 ```enhancer```.如果你看完本文之后还想对我有更多的了解，可以移步我的[github](https://github.com/li2568261)；

### 正文
实际场景中遇到一个这样的问题：商品详情页的微信页面，未注册的用户点击购买一个商品，我们希望能够实现静默登录就有如下几个步骤：
1. 获取code；
2. 获取openId、AccessToken；
3. 根据openId、获取openId、AccessToken；获取用户信息实现自动注册然后登录；
4. 跳到商品购买页。

这是就是一个典型异步数据流的过程。在上一个函数执行到某个时候再去调用下一个函数，使得这些个函数能够顺序执行。我们简化一下，构建如下的函数数组使得他们能够顺序执行吧：

```javascript
const fucArr = [
    next=>{
        setTimeout(()=>{
          	console.log(1);
          	next()
        }, 300)
    },
    next=>{
        setTimeout(()=>{
          	console.log(2);
          	next()
        }, 200)
      },
    next=>{
        setTimeout(()=>{
            console.log(3);
            next()
        }, 100)
    }
]
```
撸起袖子就开始干了起来，有三个函数，基于走一步看一步思想（瞎胡说的）那我就先执行两个吧
```javascript
fucArr[0]( fucArr[1] );// funcArr[1] 运行报错 TypeError: next is not a function
```
报错，因为```fucArr[1]```中有```next```函数调用，也得接收一个函数，这下就麻烦了，```fucArr[1]```又不能直接传参调用（因为会比```fucArr[0]```先执行），于是乎我们需要婉转一点。
```javascript
fucArr[0]( ()=>fucArr[1](()=>{}) ); //1 2 
```
	两个函数顺序执行搞定了那三个函数岂不是，没错,小case。
```javascript
fucArr[0]( ()=>fucArr[1](()=>{ fucArr[2](()=>{}) }) );// 1 2 3
```
那我想在数组后面再加一个函数~~内心os:不加，去死~~,这样写下去真是要没玩没了了;

既然是个数组，那咱们就循环吧，思路肯定是：1.下个函数重新整合一下，作为参数往上一个函数传；2.当到遍历到数组末尾的时候传入一个空函数进去避免报错。

OK开始，既然是循环那就来个for循环吧，既然是下一个函数传给上一个当参数，得让相邻的两个函数出现在同一个循环里啦。于是有了起手式：
```javascript
for (let index = 0; index < fucArr.length; index++) {
    const current = array[index];
    const next = array[index + 1];
    current(()=>next())
}
```
起手后发现不对呀，我需要喝口热水，压压惊，冷静一下，仔细观察一下上面咱们代码的结构发现咱们的函数结构其实是酱紫的:
```javascript
a(()=>{
    b(c)
})
```
实际就上上一个函数调用被 ```()=>``` 包裹后的下一个函数直接调用并传入一个函数```c```，而函数```c```会在函数```b```的运行的某个时刻被调用，并且能接收下一个函数作为参数然后......~~再说下去就没玩没了了~~，因此c函数的模式其实也是被一个```()=>{}```包裹住的函数；然后再观察我们上面的模式没有c传递，因此模式应该是:
```javascript
a(c=>{
    b(c)
})
// 我们再往下写一层
a(
    d=>{
        (
            c=>b(c)
        )(
            d=>c(d)
        )// 为了避免你们看不懂我在写啥，我告诉你你，这玩意儿是函数自调用
    }
)
// 怎么样是不是有一种豁然开朗的赶脚
```
* 我们发现每次新加入一个函数，都是重新构建一次```a```函数里的参数，以下我将这个参数简称函数```d```
* 于是乎我们来通过循环构建这个```d```
* 为了让循环体都能拿到```d```，因此它肯定是在循环的上层作用域
* 而且```d```具有两个特性：
* 1. 能接受一个函数作为参数，这个函数还能接收另一个函数作为参数，并会在某个时刻进行调用
* 2. 每次循环都会根据当前```d```，然后加入当前函数，按照相同模式进行重构；
* ps: 我们发现这两个特性其实和咱们传入的每个函数特性是一致的。
>		于是乎咱们把第一个数组的函数组作为起始函数：
```javascript
var statusRecord = fucArr[0];
for (let index = 1; index < fucArr.length; index++) {
    statusRecord = next=>statusRecord(()=>fucArr[index](next))
}
```
>       写完发现这样是错误的，如果调用函数statusRecord那就会变成，自己调自己，自己调自己，自己调自己，自己调自己~~皮一下很开心~~...的无限递归。
>       在循环记录当前状态的场景下，有一个经典的demo大家了解过：在一个li列表中注册点击事件，点击后alert出当前index；具体就不详述了于是statusRecord，就改写成了下面这样

```javascript

statusRecord = ((statusRecord)=>(next)=>statusRecord(()=>fucArr[index](next))(statusRecord))
```
>       为什么index不传呢？因为index是let定义，可以看做块级作用域，又有人要说js没有块级作用域，我：你说得对，再见。
>       最后咱们得到的还是这个模型要调用，别忘了传入一个函数功最后数组最后一个函数调用。不然会报错
```javascript
statusRecord(()=>{}) // 输出1、2、3
```
>     那咱们的功能就此实现了；不过可以优化一哈。咱们上面的代码有几个要素:
1. 数组循环
2. 状态传递
3. 初始状态为数组的第一个元素
4. 最终需要拿到单一的返回值
>     不就是活脱脱用来描述reduce的吗？于是乎我们可以这样撸
```javascript
//pre 前一个状态、 cur当前循环函数、next 待接收的下一个
fucArr.reduce((pre, cur)=>{
    return (next)=>pre(()=>cur(next))
})(()=>{})// 1 2 3
```

>		以上异步顺序调用的问题咱们已经理解了，咱们依次输出了1，2，3。但是咱们现实业务中常常是下一个函数执行，和上一个函数执行结果是关联的。咱们就想能不能改动题目贴合实际场景，上一个函数告诉下一个函数`console.log(n)`，于是乎题目做了一个小调整。

```javascript
const fucArr = [
    next=>{
        setTimeout(()=>{
            console.log(1);
            next(2)
        }, 300)
    },
    // 函数2
    (next,n)=>{
        console.log(n);
        next(3)
    },
    // 函数3
    (next,n)=>{
        console.log(n);
        next(4)
    }
]

fucArr.reduce((pre,cur)=>{
    return (next)=>pre((n)=>cur(next,n))
})((n)=>{console.log(n)})// 1 2 3 4
```

>		哇，功能又实现了，我们真棒。现在我们来回忆一下redux里中间件里传入函数格式
```javascript
store=>next=>action=>{
	// dosomething...
	next()
}
```
> 		在某一步中store会被剥掉，在这就不细说了，于是咱们题目再变个种
```javascript
const fucArr = [
    next=>n=>{
        setTimeout(()=>{
            console.log(n);
            next(n+1)
        }, 300)
    },
    // 函数2
    next=>n=>{
        setTimeout(()=>{
            console.log(n);
            next(n+1)
        }, 300)
    },
    // 函数3
    next=>n=>{
        setTimeout(()=>{
            console.log(n);
            next(n+1)
        }, 300)
    }
]
```
卧槽，我们发现之于之前遇到的问题，这个实现就舒服很多了。因为你传入的函数应该是直接调用，因为我们需要的调用的函数体其实是传入函数调用后返回的那个函数，不需要我们通过```()=>{...}```这种额外的包装。
于是咱们的实现就变成了：

```javascript
fucArr.reduce((pre,cur)=>{
    return (next)=>pre(cur(next))
})((n)=>{console.log(n)})
```
我们自信满满的```node xxx.js```了一下发现?????what fuck 为啥什么都没有输出，喝第二口水压压惊分析一下：
```javascript
// before 之前的第一个函数和函数模型
next=>{
    setTimeout(()=>{
        console.log(1);
        next(n+1)
    }, 300)
}
a(c=>{
    b(c)
})

// ------------
// after 现在的第一个函数和函数模型
next=>n=>{
    setTimeout(()=>{
        console.log(n);
        next(n+1)
    }, 300)
}
a(b(c))
// 发现现在的第一个函数调用之后，一个函数。这个函数还要再接收一个参数去启动
```
(⊙v⊙)嗯没错，经过精妙的分析我知道要怎么做了。
```javascript
fucArr.reduce((pre,cur)=>{
    return (next)=>pre(cur(next))
})((n)=>{console.log(n)})(1)// 1 2 3 4
```
我们来把这个功能包装成方法,就叫他compose好了。
```javascript
const compose = fucArr=>{
    if(fucArr.length === 0) return;
    if(fucArr.length === 1)	return fucArr[0]((n)=>{console.log(n)})(1)
    fucArr.reduce((pre,cur)=>{
        return (next)=>pre(cur(next))
    })((n)=>{console.log(n)})(1)
}
```
看上去那是相当的完美，根据咱们写代码的思路咱们来比对一下原版吧。

1. length === 0 时： 返回一个传入什么返回什么的函数。
2. length === 1 时： 直接返回传入函数函数。
3. length > 1 时： 构建一个a(b(c(....)))这种函数调用模型并返回，使用者自定义最后一环需要运行的函数，并且能够定义进入第一环的初始参数
```javascript
// 原版
function compose(...funcs) {
    if (funcs.length === 0) {
        return arg => arg
    }

    if (funcs.length === 1) {
        return funcs[0]
    }

    return funcs.reduce((a, b) => (...args) => a(b(...args)))
}
```

### 结语

>	最后说一点题外话，在整个实现的过程中确保异步调用顺序还有很多方式。亲测可用的方式有:
* bind
* 递归调用
* 通过new Promise 函数，将resolve作为参数方法传入上一个函数然后改变Promise状态...，
* 如果大家有兴趣可以自己实现一下，为了不把大家的思路带歪，在写的过程中并没有体现出来。
>	感谢[@MrTreasure](https://github.com/MrTreasure)帮我指出文章中的问题，如果觉得我写对你有一定的帮助，那就点个赞吧，因为您的鼓励是我最大的动力。