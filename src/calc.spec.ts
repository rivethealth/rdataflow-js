import "jest";
import { calc, expr } from "./calc";
import { storeState } from "./store";
import { runAction } from "./transaction";
import { WriteableState } from "./write";

describe("calc", () => {
  it("rerun", () => {
    const redApples = WriteableState.value(5);
    const greenApples = WriteableState.value(0);
    const oranges = WriteableState.value(10);

    let calcApples = jest.fn(() => redApples.value + greenApples.value);
    const apples = calc(calcApples);

    const calcFruit = jest.fn(() => apples.value + oranges.value);
    const fruit = calc(calcFruit);

    storeState(fruit);

    expect(calcApples).toHaveBeenCalledTimes(1);
    expect(calcFruit).toHaveBeenCalledTimes(1);
    calcApples.mockClear();
    calcFruit.mockClear();

    greenApples.setValue(10);
    expect(calcApples).toHaveBeenCalledTimes(1);
    expect(calcFruit).toHaveBeenCalledTimes(1);
    calcApples.mockClear();
    calcFruit.mockClear();

    oranges.setValue(6);
    expect(calcApples).toHaveBeenCalledTimes(0);
    expect(calcFruit).toHaveBeenCalledTimes(1);
    calcApples.mockClear();
    calcFruit.mockClear();
  });

  it("recovers from error", () => {
    const index = WriteableState.value(BigInt(0));

    const division = calc(() => BigInt(1) / index.value);

    const error = calc(() => {
      try {
        division.value;
      } catch (e) {
        return e;
      }
    });

    const errorStore = storeState(error);
    expect(errorStore.value).toBeInstanceOf(RangeError);

    index.setValue(BigInt(1));
    expect(errorStore.value).toBeUndefined();
  });

  it("runs atomically", () => {
    const a = WriteableState.value(0);
    const b = WriteableState.value(0);

    const sumFn = jest.fn(() => a.value + b.value);
    const sum = calc(sumFn);

    const sumStore = storeState(sum);
    sumFn.mockClear();

    runAction(() => {
      a.setValue(2);
      b.setValue(3);
    });
    expect(sumFn).toHaveBeenCalledTimes(1);
    expect(sumStore.value).toBe(5);
  });

  it("handles update during action", () => {
    const a = WriteableState.value(1);
    const b = WriteableState.value(0);

    const sum = calc(() => {
      const sum = a.value + b.value;
      if (a.value < 0) {
        a.setValue(0);
      }
      return sum;
    });

    const sumStore = storeState(sum);
    expect(sumStore.value).toBe(1);

    a.setValue(-1);
    expect(sumStore.value).toBe(0);
  });

  it("runs only one at a time", () => {
    const a = WriteableState.value(1);
    const b = WriteableState.value(0);

    let running = 0;
    let maxRunning = 0;
    const sum = calc(() => {
      running++;
      maxRunning = Math.max(running, maxRunning);
      const sum = a.value + b.value;
      if (a.value > 0) {
        a.setValue(0);
      }
      running--;
      return sum;
    });

    storeState(sum);
    expect(maxRunning).toBe(1);
  });

  it("avoid running irrelevant", () => {
    const source = WriteableState.value<{ a: number } | null>({ a: 1 });

    const fn = jest.fn(() => source.value);
    const c = calc(fn);

    const v = calc(() => {
      if (source.value) {
        return c.value;
      }
    });

    storeState(v);

    expect(fn).toHaveBeenCalledTimes(1);
    fn.mockClear();

    source.setValue(null);
    expect(fn).toHaveBeenCalledTimes(0);
  });
});

describe("expr", () => {
  it("save recalc", () => {
    const writeable = WriteableState.value(0);

    const fn = jest.fn(() => {
      return expr(() => writeable.value > 0);
    });
    const a = calc(fn);

    storeState(a);

    expect(fn).toHaveBeenCalledTimes(1);
    fn.mockClear();

    writeable.setValue(-1);
    expect(fn).toHaveBeenCalledTimes(0);
  });
});
