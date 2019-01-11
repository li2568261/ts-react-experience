function bindActionCreator(actionCreator, dispatch) {
  return function() {
    return dispatch(actionCreator.apply(this, arguments))
  }
}
// 高阶函数，通过闭包保持dispatch和对应actionCreator的引用。
/**
 * Turns an object whose values are action creators, into an object with the
 * same keys, but with every function wrapped into a `dispatch` call so they
 * may be invoked directly. This is just a convenience method, as you can call
 * `store.dispatch(MyActionCreators.doSomething())` yourself just fine.
 * 将传入生成 `action` 的方法集合转换成与传入的`key`值一致，传入的方法直接调用返回值传入 `dispatch` 中的方法集合。
 * 就像你自己调用 `store.dispatch(MyActionCreators.doSomething())` 一样一样的。
 * For convenience, you can also pass an action creator as the first argument,
 * and get a dispatch wrapped function in return.
 * 你也可以只传一个方法，拿到的也就是被 `dispatch` 包裹对应的方法。ps:直接看第一个函数就知道什么是包裹啦。
 * @param {Function|Object} actionCreators An object whose values are action
 * creator functions. One handy way to obtain it is to use ES6 `import * as`
 * syntax. You may also pass a single function.
 * 这就是上文所说传入的那个集合
 * @param {Function} dispatch The `dispatch` function available on your Redux
 * store.
 * 这就是 store 对应的那个dispatch
 * @returns {Function|Object} The object mimicking the original object, but with
 * every action creator wrapped into the `dispatch` call. If you passed a
 * function as `actionCreators`, the return value will also be a single
 * function.
 * 这就是上文说返回的那个集合
 */
export default function bindActionCreators(actionCreators, dispatch) {
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch)
  }

  if (typeof actionCreators !== 'object' || actionCreators === null) {
    throw new Error(
      `bindActionCreators expected an object or a function, instead received ${
        actionCreators === null ? 'null' : typeof actionCreators
      }. ` +
        `Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?`
    )
  }

  const keys = Object.keys(actionCreators)
  const boundActionCreators = {}
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const actionCreator = actionCreators[key]
    if (typeof actionCreator === 'function') {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch)
    }
  }
  // 正常的转换操作，木有什么好说的 `bindActionCreator` 相关转换切到对应函数看解释。
  return boundActionCreators
}
