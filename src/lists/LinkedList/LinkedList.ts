import { isString, isFunction, isInteger } from '../../utils/typeGuard.js';

const customInspectSymbol = Symbol.for('linkjs.util.inspect.custom');

type CbTwoArgs<T> = (element: T, index: number) => T | undefined;
type CbThreeArgsMatch<T> = (element: T | undefined, index: number, list: LinkedList<T>) => boolean;
type Find<T> = { link?: Link<T>; index?: number };

class Link<T> {
  prev: Link<T> = this;
  next: Link<T> = this;

  constructor(public data?: T, prev?: Link<T>, next?: Link<T>) {
    this.data = data;
    this.prev = prev ?? this;
    this.next = next ?? this;
  }
}

function createProxy<T>(list: LinkedList<T>) {
  return new Proxy(list, {
    get(target, prop, receiver) {
      if (Reflect.ownKeys(Reflect.getPrototypeOf(target) as object).includes(prop)) {
        // New getters that access a private field of the class should be added to the list
        const isPrivateFieldGetter = (['length'] as Array<string | symbol>).includes(prop);
        // Reflect.get is able to access getters with the correct this (receiver), but
        // since you can't read private fields of an object whose class did not declare
        // it, we need to use the target object for any getters that access private fields.
        const data = isPrivateFieldGetter ? target[prop] : Reflect.get(target, prop, receiver);
        // For methods, this means you have to redirect the method's
        // this data to the original object as well
        if (isFunction(data)) {
          return function (this: unknown, ...args: unknown[]) {
            return Reflect.apply(data, this === receiver ? target : this, args);
          };
        }
        return data;
      }
      if (!isString(prop)) return undefined;
      return target.at(parseInt(prop, 10));
    },
    set(target, prop, data) {
      if (!isString(prop)) return false;
      target.set(parseInt(prop, 10), data);
      return true;
    },
  });
}

class LinkedList<T> {
  #sentinel = new Link<T>();
  #length = 0;

  [key: string | symbol | number]: unknown;

  constructor(...elements: (T | undefined)[]) {
    // This Proxy alows the use of brackets notation to access list elements
    const proxyThis = createProxy(this);

    if (elements.length === 0) return proxyThis;

    // Reproduce the behavior of the Array constructor
    if (elements.length === 1 && isInteger(elements[0])) {
      for (let i = 0; i < elements[0]; i++) this.push(undefined);
      return proxyThis;
    }

    for (const element of elements) this.push(element);
    return proxyThis;
  }

  // Search based on the callback function from prev to next
  #findLeft(cb: CbThreeArgsMatch<T>, index = 0, link = this.#sentinel.next): Find<T> {
    for (; link !== this.#sentinel; link = link.next, index++) {
      if (cb(link.data, index, createProxy(this))) return { link, index };
    }
    return { link: undefined, index: undefined };
  }

  // Search based on the callback function from next to prev
  #findRight(
    cb: CbThreeArgsMatch<T>,
    index = this.#length - 1,
    link = this.#sentinel.prev,
  ): Find<T> {
    for (; link !== this.#sentinel; link = link.prev, index--) {
      if (cb(link.data, index, createProxy(this))) return { link, index };
    }
    return { link: undefined, index: undefined };
  }

  // Search by index (positive or negative)
  #findByIndex(
    index: number,
    start = 0,
    startLink = this.#sentinel.next,
    end = this.#length - 1,
    endLink = this.#sentinel.prev,
  ) {
    const absIndex = index < 0 ? index + this.#length : index;
    const absStart = start < 0 ? start + this.#length : start;
    const absEnd = end < 0 ? end + this.#length : end;
    const firstHalf = absIndex < (absEnd + absStart) / 2;
    const findFn: CbThreeArgsMatch<T> = (_, curIndex) => curIndex === absIndex;
    if (firstHalf) return this.#findLeft(findFn, start, startLink);
    return this.#findRight(findFn, end, endLink);
  }

  splice(startIndex: number, deleteCount: number, ...elements: (T | undefined)[]) {
    const list = new LinkedList<T>();

    if (!isInteger(startIndex)) return list;
    if (!isInteger(deleteCount) && deleteCount !== Number.POSITIVE_INFINITY) return list;
    if (deleteCount < 0) deleteCount = 0;
    if (deleteCount === 0 && elements.length === 0) return list;
    if (startIndex < -this.#length) startIndex = 0;
    // You cant delete elements if startIndex is greater than the length of the list
    // so we only need to push new element and return the empty list
    if (startIndex >= this.#length) {
      this.push(...elements);
      return list;
    }

    // Insert elements on startIndex
    const startLink = this.#findByIndex(startIndex).link as Link<T>;
    elements.reduceRight((prevLink, element) => {
      const newLink = new Link<T>(element, prevLink.prev, prevLink.prev.next);
      prevLink.prev = prevLink.prev.next = newLink;
      this.#length++;
      return newLink;
    }, startLink);

    // Remove elements between startIndex and startIndex + deleteCount
    if (deleteCount === 0) return list;
    const endIndex = startIndex + (deleteCount - 1);
    const endLink = this.#findByIndex(endIndex, startIndex, startLink).link as Link<T>;
    startLink.prev.next = endLink.next;
    endLink.next.prev = startLink.prev;

    // Insert removed elements on the list to be returned
    for (let link = startLink; link !== endLink.next; link = link.next) {
      list.push(link.data);
      this.#length--;
    }

    return list;
  }

  // Add elements to the end of the list
  push(...elements: (T | undefined)[]): number {
    for (const element of elements) {
      const newLink = new Link<T>(element, this.#sentinel.prev, this.#sentinel);
      this.#sentinel.prev = this.#sentinel.prev.next = newLink;
      this.#length++;
    }

    return this.#length;
  }

  // Remove elements from the end of the list
  pop(): T | undefined {
    if (this.#length === 0) return undefined;
    const removedLink = this.#sentinel.prev;
    this.#sentinel.prev = this.#sentinel.prev.prev;
    this.#sentinel.prev.next = this.#sentinel;
    this.#length--;

    return removedLink.data;
  }

  // Add elements to the front of the list
  unshift(...elements: (T | undefined)[]): number {
    elements.reduceRight((_, element) => {
      const newLink = new Link<T>(element, this.#sentinel, this.#sentinel.next);
      this.#sentinel.next.next.prev = this.#sentinel.next = newLink;
      this.#length++;
      return null;
    }, null);

    return this.#length;
  }

  // Remove elements from the front of the list
  shift(): T | undefined {
    if (this.#length === 0) return undefined;
    const removedLink = this.#sentinel.next;
    this.#sentinel.next = this.#sentinel.next.next;
    this.#sentinel.next.prev = this.#sentinel;
    this.#length--;

    return removedLink.data;
  }

  // Returns the list element at the given index.
  // Accepts negative integers, which count back from the last element.
  at(index: number): T | undefined {
    if (!isInteger(index)) return undefined;
    if (index < -this.#length || index >= this.#length) return undefined;
    const { link } = this.#findByIndex(index);
    if (link) return link.data;
  }

  // Puts the given data into the given index
  set(index: number, data: T): T | undefined {
    if (!isInteger(index)) return undefined;
    while (index >= this.#length) this.push(undefined);
    while (index < -this.#length) this.unshift(undefined);
    const { link } = this.#findByIndex(index);
    if (link) link.data = data;
    return data;
  }

  findIndex(callback: CbThreeArgsMatch<T>) {
    const { index } = this.#findLeft(callback);
    return index;
  }

  static from<Type>(listLike: ArrayLike<Type>, mapFn?: CbTwoArgs<Type>) {
    const newList = new LinkedList<Type>();
    if (isFunction(mapFn)) {
      for (let i = 0; i < listLike.length; i++) newList.push(mapFn(listLike[i], i));
    } else {
      for (let i = 0; i < listLike.length; i++) newList.push(listLike[i]);
    }

    return newList;
  }

  get length(): number {
    return this.#length;
  }

  // Method that turns instaces of the class into iterables
  // i.e. for...of calls this method. Same as [Symbol.iterator]: function*()
  *[Symbol.iterator]() {
    for (let element = this.#sentinel.next; element !== this.#sentinel; element = element.next) {
      yield element.data;
    }
  }

  toString(): string {
    if (this.#length === 0) return '[]';

    let result = '[';
    for (let i = this.#sentinel.next; i !== this.#sentinel; i = i.next) {
      result += i.data + ', ';
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
