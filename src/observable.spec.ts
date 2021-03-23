import "jest";
import { BehaviorSubject, of, Subject } from "rxjs";
import { debounceTime, first, tap } from "rxjs/operators";
import { autorun } from "./calc";
import { rxToState, stateToRx } from "./observable";
import { storeState } from "./store";
import { WriteableState } from "./write";

describe("rxToState", () => {
  it("inits", () => {
    const observable = new BehaviorSubject<number>(1);

    const state = rxToState(observable);

    const stateStore = storeState(state);

    expect(stateStore.value).toBe(1);
  });

  it("updates", () => {
    const observable = new Subject<number>();

    const state = rxToState(observable);

    const stateStore = storeState(state);
    expect(stateStore.value).toBe(undefined);

    observable.next(1);
    expect(stateStore.value).toBe(1);
  });

  it("uses first value", () => {
    const state = rxToState(of(1));

    const fn = jest.fn();
    autorun(() => fn(state.value));

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toBeCalledWith(1);
  });
});

xdescribe("stateToRx", () => {
  it("debounces", async () => {
    const writeable = WriteableState.value(0);
    const rx = stateToRx(writeable).pipe(
      debounceTime(0),
      tap((a) => console.log("VALUE: ", a)),
    );

    const fn = jest.fn();
    const subscription = rx.subscribe(fn);

    expect(fn).toHaveBeenCalledTimes(1);
    fn.mockClear();

    writeable.setValue(1);
    writeable.setValue(2);
    expect(fn).toHaveBeenCalledTimes(0);
    fn.mockClear();

    await new Promise((resolve) => setTimeout(resolve, 1));
    expect(fn).toHaveBeenCalledTimes(1);
    fn.mockClear();

    subscription.unsubscribe();
  });
});
