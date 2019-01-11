# react一些小姿势

### 整体框架的理解

​		电影是由一个个帧构成，播放的过程就是帧的替换。`react` 官方文档元素渲染模块有句这样的话：**React 元素都是不可变的。当元素被创建之后，你是无法改变其内容或属性的。一个元素就好像是动画里的一帧，它代表应用界面在某一时间点的样子。**

​		结合实际去理解，就是当页面构建，网页就形成了初始帧，网页上的展现内容是由`state`去控制，`react`可以通过setState通过改变状态去做帧的切换，由此实现页面展现效果的变化。为了提升性能，并尽可能快且正确的切换帧，react做了如下优化：

1. 异步的setState。
2. 采用diff算法，尽可能快的进行元素比较，并找到相应元素替换。
3. 引用fiber算法，减少深层级组件对网页响应的影响。

## react中使用ts

1. 组件定义

```typescript
//我们可以在 /node_modules/@type/React 找到有关Component的定义，我们截取部分
interface Component<P = {}, S = {}, SS = any> extends ComponentLifecycle<P, S, SS> { }
class Component<P, S> {
    constructor(props: Readonly<P>);
    state: Readonly<S>;
    // ....
}
// 可以看出定义一个组件可以通过定义泛型去指定他的props和state类型
interface IDemoProps{
    a: string,
    b: string
}
interface IDemoState{
    c: string,
    d: string
}
// 当你定义一个组件时定义了State类型，你至少以下列一种方式指定state属性,否则会报错；
class Demo extends Component<IDemoProps, IDemoState>{
	// 方式一
    state={
        c: 1,
        d: 2
    }
    constructor(props: IDemoProps){
        super(props);
        // 方式二
        this.state = {
            c: 'c',
            d: 'd'
        }
        props.c // 报错，属性不存在
    }
    render(){
        return <>
            <div>{this.state.c}</div>
            <div>{this.props.a}</div>
        </>
    }
}
// 当组件内部不需要使用生命周期钩子，或者组件内不保存自身状态时，可简化成函数式组件
// 同样我们找到定义方式
interface FunctionComponent<P = {}> {
    (props: P & { children?: ReactNode }, context?: any): ReactElement<any> | null;
	//	...
}
const Demo = (props: IDemoProps)=>{
    return <>
            <div>{this.state.c}</div>
            <div>{this.props.a}</div>
    </>
}
// pureComponent 在写组件的过程中同学会用到 pureComponent 去提升组件的性能
// 从描述上来看它和普通的Component没有区别
class PureComponent<P = {}, S = {}, SS = any> extends Component<P, S, SS> { }
// 截取一段 pureComponent 源码进行比较发现他就是当组件不存在shouldComponetUpdate这个钩子时，会自己新增一条规则即前后 props 和 state 进行浅比较判断是否需要修改组件。
if (inst.shouldComponentUpdate) {
  shouldUpdate = inst.shouldComponentUpdate(nextProps, nextState, nextContext);
} else {
  if (this._compositeType === CompositeType.PureClass) {
    // 用 shallowEqual 对比 props 和 state 的改动
    // 如果都没改变就不用更新
    shouldUpdate =
      !shallowEqual(prevProps, nextProps) ||
      !shallowEqual(inst.state, nextState);
  }
}

//在 /node_modules/@type/React 中还可以找到这些，我可以理解成这是component的接口声明方式
interface ComponentClass<P = {}, S = ComponentState> extends StaticLifecycle<P, S> {
    new (props: P, context?: any): Component<P, S>;
	// ....
}
// sfc fc StatelessComponent 都是 FunctionComponent 的别名。
type ComponentState = any;
type SFC<P = {}> = FunctionComponent<P>;
type StatelessComponent<P = {}> = FunctionComponent<P>;
type FC<P = {}> = FunctionComponent<P>;
type ComponentType<P = {}> = ComponentClass<P> | FunctionComponent<P>;
// 因此当我们以组件作为参数传递的时候可以使用ComponentType进行声明
```

ps: 当我们用第三方库的时候，不妨看看他们的d.ts文件，这个可能是最好的文档。

2. 视图的拆分

我们在组件的书写过程中，由于展示视图过于复杂，render函数的时候常常会遇到大段大段的dom和一些复杂的条件渲染。如果把他们都放在同一个函数下会造成组件代码太长，不利于维护，因此拆分就很有必要了。我常常用到以下几种拆分方式：

```typescript
// 拆分成组件，把大组件拆分成多个小组件，这时候不免一些方法的传递，为了使得 this 绑定当前组件，定义方法时可以采用下面switchItemHandler这种方式，避免再进行一个bind。
//...component dosomthing....
switchItemHandler = (checkItem:checkedItemData)=>{
    this.setState...
}
render(){
        return <>
        <TabHead
            switchItemHandler={this.switchItemHandler}
            // ...
        ></TabHead>
        <MiddleBar
        	//....
        ></MiddleBar>
        <ScrollEndLoadComponent
            //....
		></ScrollEndLoadComponent>
    </>
 }
// 有时候逐个参数传递太麻烦了我们可以定义一个返回jsxElement的函数，然后通过call去调用，注意，使用bind、call、apply的函数，在ts中的定义，需要在形参中加入this的类型定义。
export const comfirm = function(this: GoodsBuy){
  return <div className="flex-bottom">
    <div className="button-fill-large" onClick={this.createOrder}>
      确认兑换
    </div>
  </div>
}
// class GoodsBuy
render(){
    return <div className="goodsBuy">
      {goodsAndCount.call(this)}
      {total.call(this)}
      {comfirm.call(this)}
    </div>
}
```

### 一个组件说说HOC 、 props render

> 在手机端业务中当有长列表，常常需要逐步加载相应的需要展现的内容。页面滚动至底部加载就是其中一个策略。接下来我们就来讲这个功能进行抽离实现组件化。

 滚动至底部加载我们可以把这个逻辑进行拆分一下。

1. 监听滚动条事件的监听。
2. 数据加载策略。
3. 具体列表内容的展现。

做过微信小程序的同学可能记得它提供一个`onReachBottom`上拉触底的钩子，参照这个设计思路我希望我定义组件时，加入一个钩子，在滚动到底部的时候这个钩子会被调用。

```typescript
// component
scrollInBottom = ()=>{
    // do something..
}
```

通常情况下我们需要去做监听调用。

```typescript
scrollBottomHandler = ()=>{
    if(document.body.scrollHeight - document.body.scrollTop  <  innerHeight + 10)
        this.scrollInBottom();
}
componentDidMount(){
    document.addEventListener('scroll',this.scrollBottomHandler)
}
componentWillUnmount(){
    document.removeEventListener('scroll', this.scrollBottomHandler);
}
```

我现在想把这个功能抽离，目前有两种思路：

1. 定义一个具有着三个方法的类，通过 `extends` 使得现有`Component`也能具有这个三个方法。
2. 定义一个接收一个`classComponent`（具备一个钩子`scrollInBottom`）的函数，返回一个组件，这个组件进行滚动监听，当滚动到底部的时候调用`classComponent` 的component方法（这也就是咱们常说的HOC）。

第一种方法有个很吃瘪的地方，就是当前组件如果定义了这三个方法时，会覆盖`extends`的方法，使得功能失效，需要额外的`super`操作，这里就不细说了。于是我毅然决然的选择了第二种方式。

```typescript
// 我们来根据第二种思路来描述这个方法
// 定义一个具有scrollInBottom:()=>void函数作为属性的react组件
type IComponet = {scrollInBottom: ()=>void} & Component;
// 定义一个能获取ref，实例化后能生成具有scrollInBottom的组件。
interface IHasScrollBottomClass<P = {}, S = ComponentState> extends ComponentClass<P, S>{
    new (props: P, context?: any): IComponet
}
// 接下来就是上面思路2的描述了，就不赘述啦。
const scrollBottomLoad = <T extends object,S = {}>(WrapComponent: IHasScrollBottomClass<T, S>)=>{
    return class extends Component<T>{
        subRef: IComponet | null = null
        scrollBottomHandler = ()=>{
            if(!this.subRef)return;
            if(document.body.scrollHeight - document.body.scrollTop  <  innerHeight + 10)
                this.subRef.scrollInBottom();
        }
        componentDidMount(){
            document.addEventListener('scroll',this.scrollBottomHandler)
        }
        componentWillUnmount(){
            document.removeEventListener('scroll', this.scrollBottomHandler);
        }
        render(){
            return <WrapComponent
                ref={cp=> this.subRef = cp}
                {...this.props}
            ></WrapComponent>
        }
    }
}
```

至此，滚动事件监听功能就已经抽离出来了。接下来我们要抽离加载和具体内容展示。我们码上说话

```typescript
interface QueryListModel{
  start: number;
  limit: number;
}
// 定义组件接收3个参数
interface ILoadDataAndCheckMoreProps<T, K> {
    loadFuc: (queryCondition: T & QueryListModel)=>Promise<K[]>;//数据加载函数
    queryCondition: T;// 除基础模型歪的查询条件
    render: (props: K[])=>ReactElement<{ list: K[]}>; // 渲染列表的方法
}
// 本地相关state分别保存
interface ILoadDataAndCheckMoreState<T, K>{
    noMore: boolean // 是否还有数据
    queryConditionCombin: T & QueryListModel // 条件列表
    list: K[] // 数据列表
}
const ANYTIME_REQUEST_ITEMNUMBER = 10; // 每次请求他的条数
class LoadDataAndCheckMore<T extends object, K extends object> extends Component<ILoadDataAndCheckMoreProps<T, K>, ILoadDataAndCheckMoreState<T, K>> {
    constructor(props:ILoadDataAndCheckMoreProps<T, K>){
        super(props);
        // 初始化3个状态
        this.state = {
            noMore: false,
            queryConditionCombin: this.initQueryCondition(props.queryCondition),
            list: []
        }
    }
    // 初始化状态，为啥这里要是负数呢？往下看。
    initQueryCondition = (props: T)=>{return Object.assign({}, props, {start: -ANYTIME_REQUEST_ITEMNUMBER, limit: 10 })}
    // 数据加载
    loadMore = ()=>{
        // 如果没有数据了，不再加载
        if(this.state.noMore)return;
        // 这就是上面为什么start要为负数
        this.state.queryConditionCombin.start += ANYTIME_REQUEST_ITEMNUMBER;
        // 每次请求之后，并检查还没有更多。
        this.loadListAndCheckNoMore().then((data: K[])=>{
            this.setState({
                list: this.state.list.concat(data)
            })
            Toast.hide();
        })
        // loading相关
        Toast.loading('数据加载中....', 3000)
    }
    loadListAndCheckNoMore = ()=>{
   // 判断条件是取得的数据数量，小于limit。为啥要这样，因为后端没有返回这个字段给我，我就只能这样判断咯。
        return this.props.loadFuc(this.state.queryConditionCombin).then((data:K[])=>{
            this.setState({
                noMore: data && data.length < this.state.queryConditionCombin.limit
            })
            return data;
        })
    }
    // 你懂得，哈哈哈哈哈哈哈哈哈嗝。
    scrollInBottom = ()=>{
        !this.state.noMore && this.loadMore();
    }
    // 当搜索条件变化之后，是不是要从0开始加载呢？
    componentWillReceiveProps(nextProps:ILoadDataAndCheckMoreProps<T, K>){
        this.setState({
            queryConditionCombin: this.initQueryCondition(nextProps.queryCondition),
            noMore: false,
            list: []
        },this.loadMore)
    }
    // 第一次加载数据喔。
    componentDidMount(){
        this.loadMore()
    }
    render(){
        // 我期望渲染的方式交由业务层面
        return <>
			// 为什么要用render作为函数传递呢？因为如果写成组件你需要
            // const Cp = this.props.render
            // <Cp list={this.state.list}/>
            // 这就有点狠难受了，因为props我就想传个数组，但是组件不支持啊，因为他要个对象。
            // 然后你需要重新把他拎出来，根据组件的命名规范，才能重新使用
            {this.props.render(this.state.list)}
    		// 提示提示提示咯
            <p className="loadingTips">{this.state.noMore ? '这里见底啦/(ㄒoㄒ)/~~...' : '数据加载中，请稍后...'}</p>
        </>
    }
}
// 最后是导出，为啥要这么写呢？
export default <T, K>()=> scrollBottom<
    ILoadDataAndCheckMoreProps<T, K>,
    ILoadDataAndCheckMoreState<T, K>
    >(LoadDataAndCheckMore)
// 我们回看一下scrollBottom方法。
	<T extends object,S = {}>(WrapComponent: IHasScrollBottomClass<T, S>)
// 如果直接返回scrollBottom(LoadDataAndCheckMore)，这个T和S会被当成简单的{}。这样就会造成ILoadDataAndCheckMoreProps、ILoadDataAndCheckMoreState的泛型T/K就是空对象，显然是不正确的。

```

就此个人对`react`组件封装相关的的思路就结束啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦。。。。