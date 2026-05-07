  /// <reference types="jest" />
const add = (a: number, b: number): number => a + b;

test('jest and ts-jest are working', () => {
  expect(add(1, 2)).toBe(3);
});
