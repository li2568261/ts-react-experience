# react的状态管理

### Context

业务当中，常常存在组件之间数据共用的问题，因为组件层级关系可能很复杂，通过props进行传递将会极其的繁琐。`react`为了解决这个问题，提供了一个`context`方便实现数据共享，使用方式也极其的简便。

```typescript
const {Provider, Consumer} = React.createContext('nihao');

const demo = value=>{
    return <div>{value}</div>
}
// 方式1
<Provider value="hello world">
    // ... 若干层级或者交叉，这里展示 hello world，记住这里按照上一章说的props render的写法
	<Consumer>
    	{demo}
    </Consumer>
</Provider>
// 方式2
// ...父层级，最顶层没有使用Provider会使用默认值展示 'nihao'
<Consumer>
   {demo}
</Consumer>
// 为了使得数据能获得相应并且使得视图刷新咱们可以
const {Provider, Consumer} = React.createContext();
class Pvd extends React.Component {
  	constructor(props) {
        super(props);
        this.state = {
          hello: 'hello',
        };
    }
  	this.setHello = hello => this.setState({ hello });
    render(){
		return <Provider value={{hello: this.state.hello, setHello: this.setHello}}>
            // ... 若干层级或者交叉，这里展示 hello world，记住这里按照上一章说的props render的写法
            {this.props.children}
        </Provider>
    }
}
const App = (props)=>{
    const ConsumerU = props.context.Consumer || Consumer;
    return <Pvd>
       <ConsumerU>
        {
        	props=>{
        		return <div onClick={()=>props.setHello(Math.random())}>{props.data}</div>
    		}
    	} 
       </ConsumerU>
    </Pvd>
}
```

### redux

实际`spa`项目中，公用数据模型往往比较复杂，使用上面那种方式很容易逻辑混乱，为了使其能够便于管理，常常会引入`redux`。通过阅读[redux](https://github.com/li2568261/ts-react-experience/tree/master/redux-source-read)源码发现，他是典型的以订阅发布模式设计思路，用纯函数处理数据流。主要有以下一些概念：

1. reducer 用作定义 state 更新方式。
2. action 用作 state 更新指令，一般 type 是它必有的属性。
3. reducer 接收 action 从而选取 state 更新方式进行更新，注意reducer必须有一个当存在不能识别action时候的处理方式。
4. applymiddleware 用于一些 action 的前置处理。

使用思路：

1. 通过createStore建立一个数据仓库store。
2. store 能 dispatch 一个 action ，reducer 接收到 action 会决定接下来 state 的值。
3. store 能够 store.subscribe() 增加订阅者，该方法会返回一个用于解除订阅的方法。当新增订阅后会通过一个队列对他们进行维护，当发生 dispatch 行为时，队列的监听回调会被依次调用。
4. 当 dispatch 发生后 subscribe 的回调会运行，此时可以通过 store.getState() 根据 state 的值做出相应的反应。
5. 当你某些 action 需要前置处理时你需要使用 middleware。[applymiddleware的设计思想](https://juejin.im/post/5c1ddf4fe51d451fc377e9fd)



### redux-saga

作为`redux`处理异步数据流的中间件之一，saga 利用 generator 可以多次返回以及内部挂起机制的特性(具体就不在这展开了)，更好的处理异步数据流，下面用一个实例来展示他们的用法。ps:为什么不用thunk，~~因为简单的令人发指，逼格完全不够~~因为thunk的设计思想是dispatch非标准格式的 action，而且实际数据交互还是放在业务逻辑（这个是重点）。

```typescript
import {combineReducers, createStore, applyMiddleware, Dispatch, Middleware, AnyAction, MiddlewareAPI} from 'redux';
import createSagaMiddleware from 'redux-saga';
import root from './saga';
// 两个数据模型
import user from './model/User';
// 页面控制模型
import pageCommonConfig from './model/PageCommonConfig';

// log中间件
const logMiddleWare:Middleware = (store: MiddlewareAPI)=>(next: Dispatch<AnyAction>)=>(action:any)=>{
    console.log('log:', action);
    return next(action);
}
// 调用 redux-saga 包中的 createSagaMiddleware ,创建一个sageMiddleware
const sageMiddleware = createSagaMiddleware();
export default createStore(
    combineReducers({ user , pageCommonConfig}),
    applyMiddleware(
        logMiddleWare,
        sageMiddleware
    )
);
sageMiddleware.run(root);


// root 定义
import { all, fork, CallEffectFn } from 'redux-saga/effects';
import * as User from './User';
// import * as Goods from './Goods';

var forkArray:any[] = [];
// fork 是非阻塞试监听的数组，因为我们需要同时监听多个action
const makeItertorArrayFrok = (arr: CallEffectFn<any>[])=>arr.map(item=>fork(item));

const geratorForkArray = (...arg: {}[])=>{
    arg.forEach(item=>{
        forkArray = forkArray.concat(makeItertorArrayFrok(Object.values(item)));
    })
}
// 把所有要监听的 generator 对象都包装到一个数组
geratorForkArray(User);

export default function* root(){
    try {
       // 通过 all 启动对所有 generator 的监听。
       yield all(forkArray);
    } catch(e){
        console.log(e);
    }
}

// User Address 的 CRUD
import { setUserCredit, setUserAddress, setAddressCodeTable, addOrEditUserAddress } from '@store/model/User/actions';
import { getUserCredit, getUserAddress , deleteUserAddress, modiUserAddress, getAddressTableCode} from '@api/user';
import { modiAddressItem as modiAddressI } from './actions';
import { take, call, put, takeEvery, select} from "redux-saga/effects";

// 删除警告
function showDeleteAlert(title= '警告', tips= '你确定要删除当前地址吗?'){
    return new Promise((resolve,reject)=>{
        const alertInstance = alert(title, tips, [
            { text: '取消', onPress: () => {reject();alertInstance.close()}, style: 'default' },
            { text: '确定', onPress: () => {resolve();console.log('确定')} },
        ]);
    })
    
};
// take 用于监听 action
// call 用于调用函数，该函数应该是个 generator 函数或者返回一个Promise。
export function* queryAddress(){
    try{
        // take 只监听 type 为 queryAddress 的 action 一次。
        // 因为查找地址只用调用一次，进行基础的数据构建即可。
        yield take('queryAddress');
        // 当有这个 action 被派发时往下走去请求数据
        const res = yield call(getUserAddress);
        // 拿到结果往 reducer 层抛
        yield put(setUserAddress(res));
    } catch (e) {
        
    }
}

export function* deleteAddressItem(){
    // takeEvery 监听多次，接收一个 generator 函数作为参数
    yield takeEvery('deleteAddressItem',function*(action: AnyAction){
        try{
            // 删除警告，等待响应
            yield call(showDeleteAlert)
            // select 用于查询 state 里的值，接收一个方法。然后把值拷贝出来，因为是引用类型，不要改变原有结构。
            const address: Address[] = [...yield select((state:MallStoreState)=>state.user.address)];
            // 找
            let result = address.findIndex(val=>val.addressId === action.id);
            // 找到
            if(result !== -1){
                // 默认地址不让删
                if(address[result].isDefaultAddress == "Y")return Toast.fail('默认地址不能删除', 1);		// 服务器删除
                yield call(deleteUserAddress, address[result].addressId, address[result].channel);
            }
            // 本地删除
            if(address){
                address.splice(result,1);
                yield put(setUserAddress(address));
                Toast.success('删除成功', 1);
            }
        } catch (e) {
        
        }
    });
    
}

// 修改默认地址
export function* modiAddressItemDefault(){
    // 不解释
    yield takeEvery('modiAddressItemDefault',function*(action: AnyAction){
        try{
            // 不解释+1
            const address: Address = yield select((state:MallStoreState)=>(state.user.address as Address[]).find(val=>val.addressId === action.id));
            
            if(address.isDefaultAddress === "N") {
                // 它还可以抛给自己就是往下抛不抛到reducer层
                yield put(modiAddressI(Object.assign({}, address, {isDefaultAddress : 'Y'})));
            }
        } catch (e) {
            console.log(e);
        }
    })
}
// 不解释+2
export function* modiAddressItem(){
    
    yield takeEvery('modiAddressItem',function*(action: AnyAction){
        try{
            
            const addressId = yield call(modiUserAddress, action.address);

            yield put(addOrEditUserAddress(Object.assign(action.address, {addressId: +addressId})));
        } catch (e) {
        
        }
    });
    
}

```



### react-redux

`react` 组件公共数据管理讲完了，`redux` 讲完了。要将 `redux` 和 `react` 串联，我们一般会用到 `react-redux` 。根据我们常过的 `react-redux 方法和组件，我们尝试着理解一下他们的构造思路。

1. Provider

* 首先这是一个 `react` 组件，组件参数接收一个 `redux`  的 `store`。
*  `context.Provider` 中的  ，接收的肯定是 `store.getState` 的值。
*  为了 `state` 的调整能作用于组件，组件内部肯定会有一系列的针对 `store` 的 `subscribe`。
* 当组件销毁的时候需要注销相应的 `subscribe`。



2. connect

* 接收`mapStateToProps` 方法，接收一个 `state` 作为参数，返回一个 `state` 的一个映射集合
* 接收`mapDispatchToProps` 方法，接收一个 `dispath` 作为参数，返回一个`dispatch`相应`action`的集合
* 返回一个接收`Component`的函数，将上面两个方法生产的结果作为`props`传递给`Componet`。最终返回一个高阶组件，可能比较抽象，这里大概写一下。

```typescript
// 为了让 mapStateToProps mapDispatchToProps  能拿到 state 和 dispatch我们需要借助一个Consumer
const connect = (mapStateToProps, mapDispatchToProps)=>{
    return WarpComponent=>{
        // 内部闭包
        return props=>{
            const Consumer = props.context.Consumer;
            return <Consumer>
                {
                    store=>{
                        return <WarpComponent
                				...props
				                ...mapDispatchToProps(store.dispatch)
                                ...mapStateToProps(store.state)/>
                        }
                    }
                }
            </Consumer>
        }
		
    }
} 
```

实际源码思路和这个也是差不多的，只不过多了很多数据的normalize处理。这里就不展开详述了。



that's all tk.