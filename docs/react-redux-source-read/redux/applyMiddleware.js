import compose from './compose'

/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store. This is handy for a variety of tasks, such as expressing
 * asynchronous actions in a concise manner, or logging every action payload.
 * 让 `dispatch` 更强大，能简单的处理异步场景，或者给每个action打log
 * See `redux-thunk` package as an example of the Redux middleware.
 * 看这个https://github.com/reduxjs/redux-thunk/blob/master/src/index.js。
 * Because middleware is potentially asynchronous, this should be the first
 * store enhancer in the composition chain.
 * 如果存在异步中间件（java拦截器，做方法的前置处理），它应该在调用链的最前头。
 * Note that each middleware will be given the `dispatch` and `getState` functions
 * as named arguments.
 * 注意：所有中间件都能拿到命名为 `dispatch和getState` 方法。
 * @param {...Function} middlewares The middleware chain to be applied.
 * 传入的中间件将被链式调用。
 * @returns {Function} A store enhancer applying the middleware.
 * 返回的是一个增强器格式的中间件=>回看createStore,发现执行的过程是
 * 1、applyMiddleware调用=>返回一个接收createStore为参数的函数
 * 2、调用这个返回的函数，将reducer, preloadedState作为参数传入
 * 3、...进入函数方法体力分析。
 */
export default function applyMiddleware(...middlewares) {
  return createStore => (...args) => {
    const store = createStore(...args)
    // 构建一个无增强器的store
    let dispatch = () => {
      throw new Error(
        `Dispatching while constructing your middleware is not allowed. ` +
          `Other middleware would not be applied to this dispatch.`
      )
    }
    // 定义一个必然报错的dispatch，报错内容是在中间件创建的过程中，不准dispatch。
    const middlewareAPI = {
      getState: store.getState,
      dispatch: (...args) => dispatch(...args)// 闭包又来了
    }
    /**
     * 定义一个middlewareAPI
     * getState就是store.getState的引用
     * dispatch是一个新的函数，函数里调用当前作用域下的dispatch
     * 上面那个dispatch是必然报错的，那这有啥用呢？往下看。
     */
    const chain = middlewares.map(middleware => middleware(middlewareAPI))
    /**
     * 回忆一下，官方推荐的中间件函数的格式store=>next=>action=>{dosomething....next()}
     * 这个chain得到的将是`next=>action=>{dosomething....next()}`函数数组，每个函数都保有对middlewareAPI的引用
     * 既然叫链式执行，那当然执行有先后顺序，然后都是通过next进行控制。
     */
    dispatch = compose(...chain)(store.dispatch)
    /**
     * 通过compose重写当前作用域下的dispatch。将当前作用域下必然报错的dispatch改写了喔。
     * 如何改写呢？请看compose
     */
    return {
      ...store,
      dispatch
    }
    // 最终有增强器的dispatch会被重写
  }
}
