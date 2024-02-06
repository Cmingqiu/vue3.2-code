import { REACTIVE_FLAG } from '@vue/reactivity';

export const isObject = target => typeof target === 'object' && target !== null;

export const isFunction = val => typeof val === 'function';

export const isRef = val => !!val?.__v_isReactive;

export const isReactive = val => val && val[REACTIVE_FLAG.IS_REACTIVE];
