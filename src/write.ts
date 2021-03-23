import { Equal } from "./equal";
import {
  State,
  StateListener,
  StateObservable,
  StateSubscription,
} from "./core";
import { DebugInfo } from "./debug";
import { Result } from "./result";
import { runAction } from "./transaction";
import { Manager } from "./util";

/**
 * Writeable static
 */
export class WriteableState<T> extends State<T> {
  constructor(readonly observable: WriteableObservable<T>) {
    super();
  }

  get result() {
    return this.observable.result;
  }

  set(value: Result<T>) {
    runAction(() => this.observable.set(value));
  }

  setError(error: any) {
    this.set(new Result.Error(error));
  }

  setValue(value: T) {
    this.set(new Result.Value(value));
  }

  static error<T>(error: any, equals: Equal<T> = Equal.identity()) {
    return new WriteableState(
      new WriteableObservable(
        new Result.Error(error),
        equals,
        DebugInfo.capture(2),
      ),
    );
  }

  static value<T>(value: T, equals: Equal<T> = Equal.identity()) {
    return new WriteableState(
      new WriteableObservable(
        new Result.Value(value),
        equals,
        DebugInfo.capture(2),
      ),
    );
  }
}

/**
 * Writeables
 */
export class WriteableObservable<T> implements StateObservable<T> {
  constructor(
    initial: Result<T>,
    private readonly equals: Equal<T>,
    private readonly debugInfo: DebugInfo,
  ) {
    this.store = new Manager(
      initial,
      this.equals,
      {
        activate() {},
        change: () => {
          if (this.dirty) {
            return;
          }
          this.dirty = true;
          this.store.dirty();
        },
        deactivate: () => {
          this.dirty = false;
        },
      },
      this.debugInfo,
    );
  }

  private dirty = false;

  private readonly store: Manager<T>;

  get result() {
    return this.store.get();
  }

  calc() {
    if (!this.dirty) {
      return;
    }
    this.dirty = false;
    this.store.changed();
  }

  subscribe(listener: StateListener): StateSubscription {
    return this.store.subscribe(listener);
  }

  set(value: Result<T>) {
    this.store.set(value);
  }
}
