import "jest";
import { autorun, calc } from "./calc";
import { arrayMap } from "./collection";
import { WriteableState } from "./write";

describe("arrayMap", () => {
  it("cache", () => {
    const a = WriteableState.value([1, 2, 3]);
    const fn = jest.fn();
    const mapped = a.pipe(
      arrayMap((n) =>
        calc(() => {
          fn();
          return n.value + 1;
        })
      )
    );

    let value: number[];
    autorun(() => (value = mapped.value));

    expect(value!).toEqual([2, 3, 4]);
    expect(fn).toHaveBeenCalledTimes(3);
    fn.mockClear();

    a.setValue([3, 2, 4]);
    expect(value!).toEqual([4, 3, 5]);
    expect(fn).toHaveBeenCalledTimes(1);
    fn.mockClear();

    a.setValue([1, 3]);
    expect(value!).toEqual([2, 4]);
    expect(fn).toHaveBeenCalledTimes(1);
    fn.mockClear();

    a.setValue([]);
    expect(value!).toEqual([]);
    expect(fn).toHaveBeenCalledTimes(0);
    fn.mockClear();
  });
});
