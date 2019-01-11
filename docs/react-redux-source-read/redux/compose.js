/**
 * 没错就是看我（要是没有按照推荐顺序来看，请忽略这句话）
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for
 * the resulting composite function.
 * compose=>字面意思排版，就是将传入的函数，排个版。
 * 将传入函数从后往前的顺序，重新排版成单个参数的函数。
 * 最后那个函数可接收多个参数，因为他是最后一个环节，为整个复合函数提供返回值。
 * @param {...Function} funcs The functions to compose.
 * @returns {Function} A function obtained by composing the argument functions
 * from right to left. For example, compose(f, g, h) is identical to doing
 * (...args) => f(g(h(...args))).
 */

// 自定义一个函数，分别顺序传入如下3个函数，使得顺序输出 1 2 3；

export default function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg
  }

  if (funcs.length === 1) {
    return funcs[0]
  }

  return funcs.reduce((a, b) => (...args) => a(b(...args)))
}
