import $$observable from 'symbol-observable'

import ActionTypes from './utils/actionTypes'
import isPlainObject from './utils/isPlainObject'

/**
 * Creates a Redux store that holds the state tree.
 * The only way to change the data in the store is to call `dispatch()` on it.
 * redux数据仓库由状态树构成，只能通过调用dispatch方法去修改。
 * There should only be a single store in your app. To specify how different
 * parts of the state tree respond to actions, you may combine several reducers
 * into a single reducer function by using `combineReducers`.
 * 一个项目应当只有一个数据仓库，为了区分状态树对应的`action`,你需要用`combinReducers`讲他们各自的`reducer`合并成一个`reducer`
 * @param {Function} reducer A function that returns the next state tree, given
 * the current state tree and the action to handle.
 * 一个返回当前状态树和`action`的函数
 * @param {any} [preloadedState] The initial state. You may optionally specify it
 * to hydrate the state from the server in universal apps, or to restore a
 * previously serialized user session.
 * 缺省补齐，或者数据恢复
 * If you use `combineReducers` to produce the root reducer function, this must be
 * an object with the same shape as `combineReducers` keys.
 * 如果使用combinReducers，那对象结构应和combinReducer保持一致
 * @param {Function} [enhancer] The store enhancer. You may optionally specify it
 * to enhance the store with third-party capabilities such as middleware,
 * time travel, persistence, etc. The only store enhancer that ships with Redux
 * is `applyMiddleware()`.
 * 状态恢复、状态持久化、中间件，目前Redux自带增强器是`applyMiddleware`
 * @returns {Store} A Redux store that lets you read the state, dispatch actions
 * and subscribe to changes.
 */

export default function createStore(reducer, preloadedState, enhancer) {
  if (
    (typeof preloadedState === 'function' && typeof enhancer === 'function') ||
    (typeof enhancer === 'function' && typeof arguments[3] === 'function')
  ) {
    throw new Error(
      'It looks like you are passing several store enhancers to ' +
        'createStore(). This is not supported. Instead, compose them ' +
        'together to a single function'
    )
  }
  // 只能传入一个 enhancer <= 对应日常使用的中间件
  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState
    preloadedState = undefined
  }
  // 重载处理
  if (typeof enhancer !== 'undefined') {
    if (typeof enhancer !== 'function') {
      throw new Error('Expected the enhancer to be a function.')
    }
    // 等看applyMiddleware再回头看
    return enhancer(createStore)(reducer, preloadedState)
  }
  // 跑一手增强器，增强器应该接收createStore返回一个函数，接收reducer和初始化状态.先往下看，等到官方的applyMiddleware就知道咋回事了。
  if (typeof reducer !== 'function') {
    throw new Error('Expected the reducer to be a function.')
  }

  let currentReducer = reducer
  let currentState = preloadedState
  let currentListeners = []
  let nextListeners = currentListeners
  let isDispatching = false
  // 监听者模式起手式，reducer 作用于 currentState

  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice()
    }
  }
  // 保证在所有`dispatch`运行的过程中，不会当前的监听者不会被后续监听者影响，现在不了解往下看 `subscribe` 和 `unsubscribe`;

  /**
   * Reads the state tree managed by the store.
   *
   * @returns {any} The current state tree of your application.
   */
  function getState() {
    if (isDispatching) {
      throw new Error(
        'You may not call store.getState() while the reducer is executing. ' +
          'The reducer has already received the state as an argument. ' +
          'Pass it down from the top reducer instead of reading it from the store.'
      )
    }
    // 找到`dispatch`函数，你会看到`isDispatching`开关，所以出现这个警告是在`reducer`里调用了`getState`,应该直接在当前`state`里拿就可以了。。
    return currentState
  }
  
  /**
   * Adds a change listener. It will be called any time an action is dispatched,
   * and some part of the state tree may potentially have changed. You may then
   * call `getState()` to read the current state tree inside the callback.
   * 每新增一个监听者会在任何action被dispatch时调用，因为状态树可能会发生改变；你可以在传入的回调函数内通过getState去获取当前状态树
   * You may call `dispatch()` from a change listener, with the following
   * caveats:
   * 
   * 1. The subscriptions are snapshotted just before every `dispatch()` call.
   * If you subscribe or unsubscribe while the listeners are being invoked, this
   * will not have any effect on the `dispatch()` that is currently in progress.
   * However, the next `dispatch()` call, whether nested or not, will use a more
   * recent snapshot of the subscription list.
   *
   * 2. The listener should not expect to see all state changes, as the state
   * might have been updated multiple times during a nested `dispatch()` before
   * the listener is called. It is, however, guaranteed that all subscribers
   * registered before the `dispatch()` started will be called with the latest
   * state by the time it exits.
   * 你在监听回调中调用`dispatch`要注意：
   * 1、在所有的`dispatch`之前，监听者都会被缓存下来，在监听函数执行的过程中不论新增监听者的回调不会被执行，被取消的监听者函数还是会被执行。
   * 2、无论在执行的过程中有多少个`dispatch`，监听函数拿到的都是，`dispatch`执行之前的那个`state`。
   * @param {Function} listener A callback to be invoked on every dispatch.
   * @returns {Function} A function to remove this change listener.
   */
  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Expected the listener to be a function.')
    }

    if (isDispatching) {
      throw new Error(
        'You may not call store.subscribe() while the reducer is executing. ' +
          'If you would like to be notified after the store has been updated, subscribe from a ' +
          'component and invoke store.getState() in the callback to access the latest state. ' +
          'See https://redux.js.org/api-reference/store#subscribe(listener) for more details.'
      )
      // 在reducer里别搞监听
    }
    
    let isSubscribed = true
    ensureCanMutateNextListeners()
    // 上面注意的两点第一个，新建了一个引用去新注册，但不是一直会新建引用。
    nextListeners.push(listener)
    // 新加一个监听器
    return function unsubscribe() {
      if (!isSubscribed) {
        return
      }

      if (isDispatching) {
        throw new Error(
          'You may not unsubscribe from a store listener while the reducer is executing. ' +
            'See https://redux.js.org/api-reference/store#subscribe(listener) for more details.'
        )
      }

      isSubscribed = false

      ensureCanMutateNextListeners()
      const index = nextListeners.indexOf(listener)
      nextListeners.splice(index, 1)
    }
    // 解除监听的方式就是从监听者数组里移除那个。
  }

  /**
   * Dispatches an action. It is the only way to trigger a state change.
   * `dispatch` 一个 `action` 是唯一触发state修改的方式.
   * The `reducer` function, used to create the store, will be called with the
   * current state tree and the given `action`. Its return value will
   * be considered the **next** state of the tree, and the change listeners
   * will be notified.
   * `reducer` 通常是结合传入当前的 `state` 和 `action` 用来创建 store的，这玩意儿的返回值讲被用作下个state，
   * 那些监听者的相关回调都会被触发
   * The base implementation only supports plain object actions. If you want to
   * dispatch a Promise, an Observable, a thunk, or something else, you need to
   * wrap your store creating function into the corresponding middleware. For
   * example, see the documentation for the `redux-thunk` package. Even the
   * middleware will eventually dispatch plain object actions using this method.
   * 基础的Reduxaction只能为纯`object`,如果你想传一些其他的东西，你可能要通过中间件去做处理啦；
   * 比如：`redux-thunk`,中间件的最终返回值必须得是纯`object`；
   * @param {Object} action A plain object representing “what changed”. It is
   * a good idea to keep actions serializable so you can record and replay user
   * sessions, or use the time travelling `redux-devtools`. An action must have
   * a `type` property which may not be `undefined`. It is a good idea to use
   * string constants for action types.
   * 参数 `action` 标识你想干啥子，我觉得 `action` 应为一个有一个为非undefined的type属性这种约定棒棒哒。
   * @returns {Object} For convenience, the same action object you dispatched.
   * 返回你传过来的
   * Note that, if you use a custom middleware, it may wrap `dispatch()` to
   * return something else (for example, a Promise you can await).
   * 如果你用中间件。。。你可以尝试着返回一个promise结合await去写
   */
  function dispatch(action) {
    if (!isPlainObject(action)) {
      throw new Error(
        'Actions must be plain objects. ' +
          'Use custom middleware for async actions.'
      )
    }
    // 不解释
    if (typeof action.type === 'undefined') {
      throw new Error(
        'Actions may not have an undefined "type" property. ' +
          'Have you misspelled a constant?'
      )
    }
    // 不解释 + 1
    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.')
    }
    // 不解释 + 2
    try {
      isDispatching = true
      currentState = currentReducer(currentState, action)
      // 跑一手 reducer
    } finally {
      isDispatching = false
    }

    const listeners = (currentListeners = nextListeners)
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i]
      listener()
    }
    // 一个一个跑，注意了你的这个listeners你单独的引用listener在运行的时候如果有注册新的lisener会新建一个新的Array引用喔。
    return action
  }

  /**
   * Replaces the reducer currently used by the store to calculate the state.
   *
   * You might need this if your app implements code splitting and you want to
   * load some of the reducers dynamically. You might also need this if you
   * implement a hot reloading mechanism for Redux.
   * 当你存在一些模块的时候，你并不想加入所有的reducer，而这些的某个模块引入的时候，就需要重新构建一下reducer
   * @param {Function} nextReducer The reducer for the store to use instead.
   * @returns {void}
   */
  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error('Expected the nextReducer to be a function.')
    }

    currentReducer = nextReducer
    dispatch({ type: ActionTypes.REPLACE })
    // 还记得那些私有action的不啦。
  }

  /**
   * Interoperability point for observable/reactive libraries.
   * @returns {observable} A minimal observable of state changes.
   * For more information, see the observable proposal:
   * https://github.com/tc39/proposal-observable
   * 额外的一个注册监听者方法的方式：根据执行状态动态控制next函数（因为是引用类型next可以重新赋值）
   */
  function observable() {
    const outerSubscribe = subscribe
    return {
      /**
       * The minimal observable subscription method.
       * @param {Object} observer Any object that can be used as an observer.
       * The observer object should have a `next` method.
       * @returns {subscription} An object with an `unsubscribe` method that can
       * be used to unsubscribe the observable from the store, and prevent further
       * emission of values from the observable.
       */
      subscribe(observer) {
        if (typeof observer !== 'object' || observer === null) {
          throw new TypeError('Expected the observer to be an object.')
        }

        function observeState() {
          if (observer.next) {
            observer.next(getState())
          }
        }

        observeState()
        const unsubscribe = outerSubscribe(observeState)
        return { unsubscribe }
      },

      [$$observable]() {
        return this
      }
    }
  }

  // When a store is created, an "INIT" action is dispatched so that every
  // reducer returns their initial state. This effectively populates
  // the initial state tree.
  // 每次构建初始化一下，没毛病;
  dispatch({ type: ActionTypes.INIT })

  return {
    dispatch,
    subscribe,
    getState,
    replaceReducer,
    [$$observable]: observable
  }
}
