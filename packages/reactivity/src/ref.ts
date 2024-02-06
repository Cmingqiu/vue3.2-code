import { isObject } from '@vue/share';
import { reactive } from './reactive';
import { trackEffect, triggerEffect } from './effect';

const toReactive = val => (isObject(val) ? reactive(val) : val);

class RefImpl {
  _value = undefined;
  deps = new Set();
  private __v_isRef = true; // 用于拆包
  constructor(public rawVal) {
    this._value = toReactive(rawVal);
  }
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
}
export function ref(val) {
  return new RefImpl(val);
}

class ObjectRefImpl {
  private __v_isRef = true;
  constructor(public target, public key) {}
  get value() {
    return this.target[this.key];
  }
  set value(newVal) {
    this.target[this.key] = newVal;
  }
}

export function toRef(target, key) {
  return new ObjectRefImpl(target, key);
}

export function toRefs(target: Record<string, any>) {
  const resObj = new (target.constructor as new () => void)();
  let key: keyof typeof target;
  for (key in target) {
    resObj[key] = toRef(target, key);
  }
  return resObj;
}
