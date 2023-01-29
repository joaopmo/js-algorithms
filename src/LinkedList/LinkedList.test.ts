import LinkedList from './LinkedList.js';

test('contructor populates the list with undefined', () => {
  const list = new LinkedList(3);
  expect(list).toHaveLength(3);
  expect(list).toContain(undefined);
});

test('constructor populates the list with correct values', () => {
  const list = new LinkedList<string | number>('a', 'b', 'c', 1, 2, 3);
  expect(list).toHaveLength(6);
  expect(list).toContain('a');
  expect(list).toContain(2);
});

test('the list string representation contains all items', () => {
  const list = new LinkedList<string | number>('a', 'b', 'c', 1, 2, 3);
  expect(list.toString()).toBe('[a, b, c, 1, 2, 3]');
});

describe('add and remove methods', () => {
  let list: LinkedList<string | number>;
  beforeEach(() => {
    list = new LinkedList<string | number>('a', 'b', 'c', 1, 2, 3);
  });

  test('adds an item to the end of the list with push()', () => {
    const newLength = list.push(42);
    expect(newLength).toBe(7);
    expect(list).toHaveLength(7);
    expect(list.toString()).toBe('[a, b, c, 1, 2, 3, 42]');
  });

  test('adds multiple items to the end of the list with push()', () => {
    const newLength = list.push(42, 'Hello', 'World', '!');
    expect(newLength).toBe(10);
    expect(list).toHaveLength(10);
    expect(list.toString()).toBe('[a, b, c, 1, 2, 3, 42, Hello, World, !]');
  });

  test('remove item from end of list wiht pop()', () => {
    const removedItem = list.pop();
    expect(list).toHaveLength(5);
    expect(removedItem).toBe(3);
    expect(list.toString()).toBe('[a, b, c, 1, 2]');
  });

  test('adds an item to the front of the list with unshift()', () => {
    const newLength = list.unshift(42);
    expect(newLength).toBe(7);
    expect(list).toHaveLength(7);
    expect(list.toString()).toBe('[42, a, b, c, 1, 2, 3]');
  });

  test('adds multiple items to the front of the list with unshift()', () => {
    const newLength = list.unshift(42, 'Hello', 'World', '!');
    expect(newLength).toBe(10);
    expect(list).toHaveLength(10);
    expect(list.toString()).toBe('[42, Hello, World, !, a, b, c, 1, 2, 3]');
  });

  test('remove item from end of list wiht shift()', () => {
    const removedItem = list.shift();
    expect(list).toHaveLength(5);
    expect(removedItem).toBe('a');
    expect(list.toString()).toBe('[b, c, 1, 2, 3]');
  });
});

describe('accessor methods', () => {
  let list: LinkedList<string | number>;
  beforeEach(() => {
    list = new LinkedList<string | number>('a', 'b', 'c', 1, 2, 3);
  });

  test('access item with at()', () => {
    expect(list.at(0)).toBe('a');
    expect(list.at(-2)).toBe(2);
  });

  test('access item with bracket notation', () => {
    expect(list[0]).toBe('a');
    expect(list[-2]).toBe(2);
  });

  test('assign existing item with set()', () => {
    list.set(0, 42);
    list.set(-2, 42);
    expect(list.at(0)).toBe(42);
    expect(list.at(-2)).toBe(42);
    expect(list.toString()).toBe('[42, b, c, 1, 42, 3]');
  });

  test('assign existing item with bracket notation', () => {
    list[0] = 42;
    list[-2] = 42;
    expect(list.at(0)).toBe(42);
    expect(list.at(-2)).toBe(42);
    expect(list.toString()).toBe('[42, b, c, 1, 42, 3]');
  });

  test('assign item to index greater than or equal length with set()', () => {
    list.set(6, 42);
    expect(list.at(6)).toBe(42);
    expect(list).toHaveLength(7);
    expect(list.toString()).toBe('[a, b, c, 1, 2, 3, 42]');

    list.set(8, 42);
    expect(list.at(8)).toBe(42);
    expect(list).toHaveLength(9);
    expect(list.toString()).toBe('[a, b, c, 1, 2, 3, 42, undefined, 42]');
  });

  test('assign item to index greater than or equal length with bracket notation', () => {
    list[6] = 42;
    expect(list[6]).toBe(42);
    expect(list).toHaveLength(7);
    expect(list.toString()).toBe('[a, b, c, 1, 2, 3, 42]');

    list[8] = 42;
    expect(list[8]).toBe(42);
    expect(list).toHaveLength(9);
    expect(list.toString()).toBe('[a, b, c, 1, 2, 3, 42, undefined, 42]');
  });

  test('assign item to index less than -length with set()', () => {
    list.set(-7, 42);
    expect(list.at(-7)).toBe(42);
    expect(list).toHaveLength(7);
    expect(list.toString()).toBe('[42, a, b, c, 1, 2, 3]');

    list.set(-9, 42);
    expect(list.at(-9)).toBe(42);
    expect(list).toHaveLength(9);
    expect(list.toString()).toBe('[42, undefined, 42, a, b, c, 1, 2, 3]');
  });

  test('assign item to index less than -length with bracket notation', () => {
    list[-7] = 42;
    expect(list[-7]).toBe(42);
    expect(list).toHaveLength(7);
    expect(list.toString()).toBe('[42, a, b, c, 1, 2, 3]');

    list[-9] = 42;
    expect(list[-9]).toBe(42);
    expect(list).toHaveLength(9);
    expect(list.toString()).toBe('[42, undefined, 42, a, b, c, 1, 2, 3]');
  });
});
