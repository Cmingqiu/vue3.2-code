import { isFunction } from '@vue/share';
import { ReactiveEffect, trackEffect, triggerEffect } from './effect';

class ComputedRefImpl {
  effect = null;
  dirty = true;
  _value = undefined;
  deps = new Set();
  private __v_isRef = true; // 用于拆包
  constructor(getter, public setter) {
    this.effect = new ReactiveEffect(getter, () => {
      if (!this.dirty) {
        this.dirty = true;
        triggerEffect(this.deps);
      }
    });
  }
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
}

export function computed(getterOrOptions) {
  let getter, setter;
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
    setter = () => {
      console.warn('computed is readonly');
    };
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
}
