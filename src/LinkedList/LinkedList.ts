import { isString, isFunction, isInteger } from '../utils/typeGuard.js';

const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom');

type Callback<T> = (item?: T, index?: number, list?: LinkedList<T>) => T | boolean | void;

class Link<T> {
  left: Link<T> = this;
  right: Link<T> = this;

  constructor(public value?: T, left?: Link<T>, right?: Link<T>) {
    this.value = value;
    this.left = left ?? this;
    this.right = right ?? this;
  }
}

class LinkedList<T> {
  #sentinel = new Link<T>();
  #length = 0;

  [key: string | symbol | number]: unknown;

  constructor(...items: (T | undefined)[]) {
    // This Proxy alows the use of brackets notation to access list items
    const proxyThis = new Proxy(this, {
      get(target, prop, receiver) {
        if (Reflect.ownKeys(Reflect.getPrototypeOf(target) as object).includes(prop)) {
          // New getters that access a private field of the class should be added to the array
          const isPrivateFieldGetter = (['length'] as Array<string | symbol>).includes(prop);
          // Reflect.get is able to access getters with the correct this (receiver), but
          // since you can't read private fields of an object whose class did not declare
          // it, we need to use the target object for any getters that access private fields.
          const value = isPrivateFieldGetter ? target[prop] : Reflect.get(target, prop, receiver);
          // For methods, this means you have to redirect the method's
          // this value to the original object as well
          if (isFunction(value)) {
            return function (this: unknown, ...args: unknown[]) {
              return Reflect.apply(value, this === receiver ? target : this, args);
            };
          }
          return value;
        }
        if (!isString(prop)) return undefined;
        return target.at(parseInt(prop, 10));
      },
      set(target, prop, value) {
        if (!isString(prop)) return false;
        target.set(parseInt(prop, 10), value);
        return true;
      },
    });

    if (items.length === 0) return proxyThis;

    // Reproduce the behavior of the Array constructor
    if (items.length === 1 && isInteger(items[0])) {
      for (let i = 0; i < items[0]; i++) this.push(undefined);
      return proxyThis;
    }

    for (const item of items) this.push(item);
    return proxyThis;
  }

  // Search based on the callback function from left to right
  #findLeft(callback: Callback<T>): { node?: Link<T>; index?: number } {
    for (
      let node = this.#sentinel.right, index = 0;
      node !== this.#sentinel;
      node = node.right, index++
    ) {
      if (callback(node.value, index)) return { node, index };
    }
    return {};
  }

  // Search based on the callback function from right to left
  #findRight(callback: Callback<T>): { node?: Link<T>; index?: number } {
    for (
      let node = this.#sentinel.left, index = this.#length - 1;
      node !== this.#sentinel;
      node = node.left, index--
    ) {
      if (callback(node.value, index)) return { node, index };
    }
    return {};
  }

  // Add items to the end of the list
  push(...items: (T | undefined)[]): number {
    for (const item of items) {
      this.#sentinel.left.right = new Link<T>(item, this.#sentinel.left, this.#sentinel);
      this.#sentinel.left = this.#sentinel.left.right;
      this.#length++;
    }

    return this.#length;
  }

  // Remove items from the end of the list
  pop(): T | undefined {
    if (this.#length === 0) return undefined;
    const removedLink = this.#sentinel.left;

    this.#sentinel.left = this.#sentinel.left.left;
    this.#sentinel.left.right = this.#sentinel;
    this.#length--;

    return removedLink.value;
  }

  // Add items to the front of the list
  unshift(...items: (T | undefined)[]): number {
    items.reduceRight((_, item) => {
      this.#sentinel.right = new Link<T>(item, this.#sentinel, this.#sentinel.right);
      this.#sentinel.right.right.left = this.#sentinel.right;
      this.#length++;
      return null;
    }, null);

    return this.#length;
  }

  // Remove items from the front of the list
  shift(): T | undefined {
    if (this.#length === 0) return undefined;
    const removedLink = this.#sentinel.right;

    this.#sentinel.right = this.#sentinel.right.right;
    this.#sentinel.right.left = this.#sentinel;
    this.#length--;

    return removedLink.value;
  }

  // Returns the list item at the given index.
  // Accepts negative integers, which count back from the last item.
  at(index: number): T | undefined {
    if (!isInteger(index)) return undefined;
    if (index < -this.#length || index >= this.#length) return undefined;
    const absIndex = index < 0 ? index + this.#length : index;
    const firstHalf = absIndex <= this.#length / 2;
    const findFn: Callback<T> = (_, curIndex) => curIndex === absIndex;
    return (firstHalf ? this.#findLeft(findFn) : this.#findRight(findFn)).node?.value;
  }

  // Puts the given value into the given index
  set(index: number, value: T): T | undefined {
    if (!isInteger(index)) return undefined;
    while (index >= this.#length) this.push(undefined);
    while (index < -this.#length) this.unshift(undefined);

    const absIndex = index < 0 ? index + this.#length : index;
    const firstHalf = absIndex <= this.#length / 2;
    const findFn: Callback<T> = (_, curIndex) => curIndex === absIndex;
    const { node } = firstHalf ? this.#findLeft(findFn) : this.#findRight(findFn);
    if (node) node.value = value;
    return value;
  }

  get length(): number {
    return this.#length;
  }

  // Method that turns instaces of the class into iterables
  // i.e. for...of calls this method. Same as [Symbol.iterator]: function*()
  *[Symbol.iterator]() {
    for (let item = this.#sentinel.right; item !== this.#sentinel; item = item.right) {
      yield item.value;
    }
  }

  toString(): string {
    if (this.#length === 0) return '[]';

    let result = '[';
    for (let i = this.#sentinel.right; i !== this.#sentinel; i = i.right) {
      result += i.value + ', ';
    }

    result = result.slice(0, -2) + ']';
    return result;
  }

  // String representation for Link
  [customInspectSymbol]() {
    return this.toString();
  }
}

export default LinkedList;
