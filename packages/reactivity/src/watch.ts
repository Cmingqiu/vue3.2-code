import { isObject, isReactive } from '@vue/share';
import { ReactiveEffect } from './effect';

export function watch(
  source,
  cb: (...args: any[]) => any,
  { immediate = false } = {}
) {
  let oldValue = undefined;
  let getter, cleanup;
  const onCleanup = fn => (cleanup = fn);

  if (isReactive(source)) {
    // 传入的是响应式对象 watch(reactive(state),()=>{})
    getter = () => traverse(source); // 访问属性，便于依赖收集
  } else {
    getter = source; // 传入的是函数 watch(()=>state.name,()=>{})
  }
  const effect = new ReactiveEffect(getter, () => {
    const newValue = effect.run(); // 拿到新值
    if (cleanup) cleanup(); // 如果回调第三个参数传了，那就在执行回调前先清理
    cb(newValue, oldValue, onCleanup);
    oldValue = newValue;
  });
  oldValue = effect.run(); // 拿到旧值
  if (immediate) {
    cb(undefined, oldValue);
  }
}

//递归访问属性用于依赖收集
function traverse(target, seen = new Set()) {
  if (!isObject(target) || seen.has(target)) return target;
  seen.add(target);
  for (let key in target) {
    traverse(target[key], seen);
  }
  return target;
}
