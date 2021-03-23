import { Equal } from "./equal";
import {
  Observable as RxObservable,
  Observer as RxObserver,
  Subscriber as RxSubscriber,
  Unsubscribable as RxUnsubscribable,
} from "rxjs";
import { State, StateListener, StateObservable } from "./core";
import { DebugInfo } from "./debug";
import { Result } from "./result";
import { runAction, TransactionScheduler } from "./transaction";
import { Manager } from "./util";

export class UnobservedError extends Error {
  constructor() {
    super("No current value because not observed");
  }
}

const UNOBSERVED_RESULT: Result<never> = new Result.Error(
  new UnobservedError()
);

const INITIAL_RESULT: Result<undefined> = new Result.Value(undefined);

export class ObservableState<T> extends State<T | undefined> {
  constructor(readonly observable: RxObservableObservable<T>) {
    super();
  }

  get result() {
    return this.observable.result;
  }
}

/**
 * Observable state
 */
class RxObservableObservable<T> implements StateObservable<T | undefined> {
  constructor(
    private readonly observable: RxObservable<T>,
    private readonly debugInfo: DebugInfo
  ) {}

  private dirty = false;

  private readonly store = new Manager<T | undefined>(
    INITIAL_RESULT,
    Equal.identity(),
    {
      activate: () => {
        if (!this.subscription_) {
          this.subscription_ = this.observable.subscribe(this.observer);
        }
      },
      change: () => {
        if (this.dirty) {
          return;
        }
        this.dirty = true;
        this.store.dirty();
      },
      deactivate: () => {
        this.dirty = false;
        this.store.set(UNOBSERVED_RESULT);
        if (this.subscription_) {
          this.subscription_.unsubscribe();
          this.subscription_ = undefined;
        }
      },
    },
    this.debugInfo
  );
  private subscription_: RxUnsubscribable | undefined;

  private readonly unsubscribeScheduler = new TransactionScheduler(() => {
    this.dirty = false;
    this.store.set(UNOBSERVED_RESULT);
    if (this.subscription_) {
      this.subscription_.unsubscribe();
      this.subscription_ = undefined;
    }
  });

  private readonly observer: RxObserver<T> = {
    complete() {},
    next: (value) => runAction(() => this.store.set(new Result.Value(value))),
    error: (error) => runAction(() => this.store.set(new Result.Value(error))),
  };

  get result() {
    if (this.store.get() === UNOBSERVED_RESULT) {
      console.log(new Error().stack);
    }
    return this.store.get();
  }

  calc() {
    if (!this.dirty) {
      return;
    }
    this.dirty = false;
    this.store.changed();
  }

  subscribe(listener: StateListener) {
    return this.store.subscribe(listener);
  }
}

class StateRxObservable<T> extends RxObservable<T> {
  constructor(private readonly observable: StateObservable<T>) {
    super((subscriber) => {
      const stateSubscriber = observable.subscribe(this.listener(subscriber));
      return () => stateSubscriber.unsubscribe();
    });
  }

  private changed = true;
  private dirty = true;

  private listener(subscriber: RxSubscriber<T>): StateListener {
    const scheduler = new TransactionScheduler(() => {
      this.dirty = false;
      this.observable.calc();
      if (!this.changed) {
        return;
      }
      this.changed = false;
      const result = this.observable.result;
      if (result instanceof Result.Value) {
        subscriber.next(result.value);
      } else {
        subscriber.error(result.error);
      }
    });

    scheduler.schedule();

    return {
      changed: () => {
        this.changed = true;
      },
      dirty: () => {
        if (this.dirty) {
          return;
        }
        this.dirty = true;
        scheduler.schedule();
      },
    };
  }

  subscribe(...args: any[]) {
    return runAction(() => super.subscribe(...args));
  }
}

/**
 * Convert StateObservable to RxJS Observable
 */
export function stateToRx<T>(state: State<T>): RxObservable<T> {
  return new StateRxObservable(state.observable);
}

/**
 * Convert RxJS Observable to StateObservable
 */
export function rxToState<T>(
  observable: RxObservable<T>
): State<T | undefined> {
  const debugInfo = DebugInfo.capture(2);
  return new ObservableState(new RxObservableObservable(observable, debugInfo));
}
