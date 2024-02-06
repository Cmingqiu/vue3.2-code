export let activeEffect = undefined;

function cleanupEffect(effect) {
  const { deps } = effect;
  for (let i = 0; i < deps.length; i++) {
    deps[i].delete(effect);
  }
  effect.deps.length = 0;
}

export class ReactiveEffect {
  active = true;
  parent = undefined;
  deps = [];
  constructor(public fn, public scheduler?) {}
  run() {
    try {
      if (!this.active) return this.fn();
      this.parent = activeEffect;
      activeEffect = this;
      cleanupEffect(this); // 收集依赖之前先把之前的清理掉
      return this.fn(); // 执行会取值，走get方法，收集依赖
    } finally {
      activeEffect = this.parent;
      this.parent = undefined;
    }
  }
  stop() {
    if (this.active) {
      this.active = false;
      cleanupEffect(this);
    }
  }
}

export function effect(fn, options?) {
  const _effect = new ReactiveEffect(fn, options?.scheduler);
  _effect.run();
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}

/**
 * 依赖收集
 * WeakMap{
 *  object_map:{
 *    key: Set(effect,..),
 *    key: Set(effect,..)
 *  },
 *  object_map:{
 *    key: Set(effect,..)
 *  }
 * }
 *  */
export const targetMap = new WeakMap();

export function track(target, key) {
  if (activeEffect) {
    let depMap = targetMap.get(target);
    if (!depMap) {
      targetMap.set(target, (depMap = new Map()));
    }
    let depSet = depMap.get(key);
    if (!depSet) {
      depMap.set(key, (depSet = new Set()));
    }
    trackEffect(depSet);
  }
}

export function trigger(target, key) {
  const depMap = targetMap.get(target);
  if (!depMap) return;
  const depSet = depMap.get(key);
  triggerEffect(depSet);
}

export function trackEffect(depSet) {
  const shouldTrack = activeEffect && !depSet.has(activeEffect);
  if (shouldTrack) {
    depSet.add(activeEffect); // 属性收集了effect
    activeEffect.deps.push(depSet); // effect也有收集属性，方便清理操作
  }
}

export function triggerEffect(depSet) {
  const effects = [...depSet];
  effects &&
    effects.forEach(effect => {
      if (effect !== activeEffect)
        effect.scheduler ? effect.scheduler() : effect.run();
    });
}
