// packages/share/src/index.ts
var isObject = (target) => typeof target === "object" && target !== null;
var isFunction = (val) => typeof val === "function";
var isRef = (val) => !!val?.__v_isReactive;
var isReactive = (val) => val && val["__v_isReactive" /* IS_REACTIVE */];

// packages/reactivity/src/effect.ts
var activeEffect = void 0;
function cleanupEffect(effect2) {
  const { deps } = effect2;
  for (let i = 0; i < deps.length; i++) {
    deps[i].delete(effect2);
  }
  effect2.deps.length = 0;
}
var ReactiveEffect = class {
  constructor(fn, scheduler) {
    this.fn = fn;
    this.scheduler = scheduler;
  }
  active = true;
  parent = void 0;
  deps = [];
  run() {
    try {
      if (!this.active)
        return this.fn();
      this.parent = activeEffect;
      activeEffect = this;
      cleanupEffect(this);
      return this.fn();
    } finally {
      activeEffect = this.parent;
      this.parent = void 0;
    }
  }
  stop() {
    if (this.active) {
      this.active = false;
      cleanupEffect(this);
    }
  }
};
function effect(fn, options) {
  const _effect = new ReactiveEffect(fn, options?.scheduler);
  _effect.run();
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}
var targetMap = /* @__PURE__ */ new WeakMap();
function track(target, key) {
  if (activeEffect) {
    let depMap = targetMap.get(target);
    if (!depMap) {
      targetMap.set(target, depMap = /* @__PURE__ */ new Map());
    }
    let depSet = depMap.get(key);
    if (!depSet) {
      depMap.set(key, depSet = /* @__PURE__ */ new Set());
    }
    trackEffect(depSet);
  }
}
function trigger(target, key) {
  const depMap = targetMap.get(target);
  if (!depMap)
    return;
  const depSet = depMap.get(key);
  triggerEffect(depSet);
}
function trackEffect(depSet) {
  const shouldTrack = activeEffect && !depSet.has(activeEffect);
  if (shouldTrack) {
    depSet.add(activeEffect);
    activeEffect.deps.push(depSet);
  }
}
function triggerEffect(depSet) {
  const effects = [...depSet];
  effects && effects.forEach((effect2) => {
    if (effect2 !== activeEffect)
      effect2.scheduler ? effect2.scheduler() : effect2.run();
  });
}

// packages/reactivity/src/reactive.ts
var REACTIVE_FLAG = /* @__PURE__ */ ((REACTIVE_FLAG2) => {
  REACTIVE_FLAG2["IS_REACTIVE"] = "__v_isReactive";
  return REACTIVE_FLAG2;
})(REACTIVE_FLAG || {});
var reactiveMap = /* @__PURE__ */ new WeakMap();
function reactive(target) {
  if (!isObject(target))
    return target;
  const proxyTarget = reactiveMap.get(target);
  if (proxyTarget)
    return proxyTarget;
  if (target["__v_isReactive" /* IS_REACTIVE */])
    return target;
  const proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  return proxy;
}
var mutableHandlers = {
  get(target, key, receiver) {
    const res = Reflect.get(target, key, receiver);
    if (key === "__v_isReactive" /* IS_REACTIVE */)
      return true;
    track(target, key);
    if (isRef(target?.[key]))
      return target[key].value;
    if (isObject(res))
      return reactive(res);
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

// packages/reactivity/src/computed.ts
var ComputedRefImpl = class {
  // 用于拆包
  constructor(getter, setter) {
    this.setter = setter;
    this.effect = new ReactiveEffect(getter, () => {
      if (!this.dirty) {
        this.dirty = true;
        triggerEffect(this.deps);
      }
    });
  }
  effect = null;
  dirty = true;
  _value = void 0;
  deps = /* @__PURE__ */ new Set();
  __v_isRef = true;
  get value() {
    trackEffect(this.deps);
    if (this.dirty) {
      this._value = this.effect.run();
      this.dirty = false;
    }
    return this._value;
  }
  set value(val) {
    this.setter(val);
  }
};
function computed(getterOrOptions) {
  let getter, setter;
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
    setter = () => {
      console.warn("computed is readonly");
    };
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
}

// packages/reactivity/src/watch.ts
function watch(source, cb, { immediate = false } = {}) {
  let oldValue = void 0;
  let getter, cleanup;
  const onCleanup = (fn) => cleanup = fn;
  if (isReactive(source)) {
    getter = () => traverse(source);
  } else {
    getter = source;
  }
  const effect2 = new ReactiveEffect(getter, () => {
    const newValue = effect2.run();
    if (cleanup)
      cleanup();
    cb(newValue, oldValue, onCleanup);
    oldValue = newValue;
  });
  oldValue = effect2.run();
  if (immediate) {
    cb(void 0, oldValue);
  }
}
function traverse(target, seen = /* @__PURE__ */ new Set()) {
  if (!isObject(target) || seen.has(target))
    return target;
  seen.add(target);
  for (let key in target) {
    traverse(target[key], seen);
  }
  return target;
}

// packages/reactivity/src/ref.ts
var toReactive = (val) => isObject(val) ? reactive(val) : val;
var RefImpl = class {
  // 用于拆包
  constructor(rawVal) {
    this.rawVal = rawVal;
    this._value = toReactive(rawVal);
  }
  _value = void 0;
  deps = /* @__PURE__ */ new Set();
  __v_isRef = true;
  get value() {
    trackEffect(this.deps);
    return this._value;
  }
  set value(newVal) {
    if (this.rawVal !== newVal) {
      this._value = toReactive(newVal);
      this.rawVal = newVal;
      triggerEffect(this.deps);
    }
  }
};
function ref(val) {
  return new RefImpl(val);
}
var ObjectRefImpl = class {
  constructor(target, key) {
    this.target = target;
    this.key = key;
  }
  __v_isRef = true;
  get value() {
    return this.target[this.key];
  }
  set value(newVal) {
    this.target[this.key] = newVal;
  }
};
function toRef(target, key) {
  return new ObjectRefImpl(target, key);
}
function toRefs(target) {
  const resObj = new target.constructor();
  let key;
  for (key in target) {
    resObj[key] = toRef(target, key);
  }
  return resObj;
}
export {
  REACTIVE_FLAG,
  ReactiveEffect,
  activeEffect,
  computed,
  effect,
  reactive,
  ref,
  targetMap,
  toRef,
  toRefs,
  track,
  trackEffect,
  trigger,
  triggerEffect,
  watch
};
//# sourceMappingURL=reactivity.js.map
