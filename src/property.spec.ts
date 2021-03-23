import "jest";
import { calc } from "./calc";
import { calculated, observable } from "./property";
import { storeState } from "./store";
import { WriteableState } from "./write";

describe("@calculated", () => {
  it("calculates value", () => {
    const writeable = WriteableState.value("old");

    const fn = jest.fn(() => writeable.value);

    class Example {
      @calculated()
      get item() {
        return fn();
      }
    }

    const example = new Example();

    const store = storeState(calc(() => example.item));

    expect(fn).toHaveBeenCalledTimes(1);
    expect(store.value).toBe("old");
    fn.mockClear();

    writeable.setValue("new");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(store.value).toBe("new");
  });
});

describe("@observable", () => {
  it("observes property", () => {
    class Example {
      @observable()
      prop!: string;
    }

    const example = new Example();

    const fn = jest.fn(() => example.prop);
    const c = calc(fn);

    const store = storeState(c);
    fn.mockClear();

    example.prop = "new";
    expect(fn).toHaveBeenCalledTimes(1);
    expect(store.value).toBe("new");
  });
});
