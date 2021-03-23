import { Equal } from "./equal";
import { State, StateListener, StateObservable } from "./core";
import { DebugInfo } from "./debug";
import { Result } from "./result";
import { Manager } from "./util";

export class ConstState<T> extends State<T> {
  constructor(readonly observable: ConstStateObservable<T>) {
    super();
  }
}

export class ConstStateObservable<T> implements StateObservable<T> {
  constructor(result: Result<T>, private readonly debugInfo: DebugInfo) {
    this.manager = new Manager(
      result,
      Equal.identity(),
      {
        activate: () => {},
        deactivate: () => {},
        change: () => {},
      },
      this.debugInfo,
    );
  }

  private readonly manager: Manager<T>;

  calc() {}

  get result() {
    return this.manager.get();
  }

  subscribe(listener: StateListener) {
    return this.manager.subscribe(listener);
  }
}

export function constError(error: any): ConstState<never> {
  const debugInfo = DebugInfo.capture(1);
  return new ConstState(
    new ConstStateObservable(new Result.Error(error), debugInfo),
  );
}

export function constValue<T>(value: T): ConstState<T> {
  const debugInfo = DebugInfo.capture(1);
  return new ConstState(
    new ConstStateObservable(new Result.Value(value), debugInfo),
  );
}
