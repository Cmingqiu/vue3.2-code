import { isObject, isRef } from '@vue/share';
import { track, trigger } from './effect';

export const enum REACTIVE_FLAG {
  IS_REACTIVE = '__v_isReactive'
}

// 缓存映射表
const reactiveMap = new WeakMap();

export function reactive(target: object) {
  if (!isObject(target)) return target;
  const proxyTarget = reactiveMap.get(target);
  if (proxyTarget) return proxyTarget;
  if (target[REACTIVE_FLAG.IS_REACTIVE]) return target;

  const proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  return proxy;
}

const mutableHandlers = {
  get(target, key, receiver) {
    const res = Reflect.get(target, key, receiver);
    if (key === REACTIVE_FLAG.IS_REACTIVE) return true;
    track(target, key);

    if (isRef(target?.[key])) return target[key].value;

    //懒递归 如果取值target[key]也是对象还会进行代理
    if (isObject(res)) return reactive(res);

    return res;
  },
  set(target, key, value, receiver) {
    const oldValue = target[key];
    const res = Reflect.set(target, key, value, receiver);
    if (oldValue !== value) {
      trigger(target, key);
    }

    return res;
  }
};
