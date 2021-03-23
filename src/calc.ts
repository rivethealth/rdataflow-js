import { Equal } from "./equal";
import {
  Context,
  ContextListener,
  Reaction,
  State,
  StateListener,
  StateObservable,
  StateSubscription,
} from "./core";
import { DebugInfo } from "./debug";
import { Result } from "./result";
import { store } from "./store";
import { runAction, TransactionScheduler } from "./transaction";
import { Manager } from "./util";

interface StateDependent {
  subscription: StateSubscription;
  state: StateObservable<unknown>;
}

const EMPTY_RESULT = new Result.Error("UNINITALIZED");

/**
 * Calculated state
 */
export class CalculatedState<T> extends State<T> {
  constructor(readonly observable: CalculatedObservable<T>) {
    super();
  }

  get result() {
    return this.observable.result;
  }

  refresh() {
    this.observable.refresh();
  }
}

/** (a: T, b: T) => boolean = Object.is
 * Calculated state observable
 */
export class CalculatedObservable<T> implements StateObservable<T> {
  constructor(
    fn: () => T,
    private readonly debugInfo: DebugInfo,
    private readonly equals: Equal<T> = Equal.identity(),
  ) {
    this.resultFn = () => Result.run(fn);
  }

  private readonly resultFn: () => Result<T>;

  private dirty = true;
  private changed = true;

  private readonly store = new Manager<T>(
    EMPTY_RESULT,
    this.equals,
    {
      activate: () => {
        this.deactivateScheduler.unschedule();
      },
      deactivate: () => {
        this.deactivateScheduler.schedule();
      },
      change: () => {
        this.store.changed();
      },
    },
    this.debugInfo,
  );

  private dependents: StateDependent[] = [];

  private readonly deactivateScheduler = new TransactionScheduler(() => {
    // reset
    this.dirty = true;
    this.changed = true;
    this.store.set(EMPTY_RESULT);

    // stop listening
    const dependents = this.dependents;
    this.dependents = [];
    for (const dependent of dependents) {
      dependent.subscription.unsubscribe();
    }
  });

  private readonly contextListener: ContextListener = {
    observed: (state: StateObservable<unknown>, track: boolean) => {
      let running = true;
      // immediately begin listening, in case that is necessary to generate value
      if (track) {
        this.dependents.push({
          state,
          subscription: state.subscribe(this.trackedListener(() => running)),
        });
      } else {
        this.dependents.push({
          state,
          subscription: state.subscribe(this.untrackedListener),
        });
      }
      state.calc();
      running = false;
    },
  };

  private trackedListener(running: () => boolean): StateListener {
    return {
      changed: (debugInfo: DebugInfo) => {
        if (this.changed || running()) {
          return;
        }
        this.changed = true;
        if (DebugInfo.ENABLED) {
          console.log(
            `INVALIDATED\n\t${this.debugInfo.position}\nBY\n\t${debugInfo.position}`,
          );
        }
      },
      dirty: () => {
        if (this.dirty) {
          return;
        }
        this.dirty = true;
        this.store.dirty();
      },
    };
  }

  private readonly untrackedListener: StateListener = {
    changed() {},
    dirty() {},
  };

  get result() {
    return this.store.get();
  }

  calc() {
    while (this.dirty) {
      this.dirty = false;
      // recalculate dependents, until change happens
      for (const { state } of this.dependents) {
        if (this.changed) {
          break;
        }
        state.calc();
      }

      if (!this.changed) {
        continue;
      }

      this.changed = false;

      // clear dependents
      const dependents = this.dependents;
      this.dependents = [];

      // recalculate
      const result = Context.run(this.contextListener, this.resultFn);

      // clean up old subscriptions
      for (const { subscription } of dependents) {
        subscription.unsubscribe();
      }

      this.store.set(result);
    }
  }

  // TODO(paul): keep?
  refresh() {
    runAction(() => {
      const listener = this.trackedListener(() => false);
      listener.changed(this.debugInfo);
      listener.dirty(this.debugInfo);
    });
  }

  subscribe(listener: StateListener) {
    return this.store.subscribe(listener);
  }
}

/**
 * Calculated state
 */
export function calc<T>(
  f: () => T,
  debug = DebugInfo.capture(2),
  equals?: Equal<T>,
): CalculatedState<T> {
  return new CalculatedState(new CalculatedObservable(f, debug, equals));
}

export function expr<T>(
  f: () => T,
  debug = DebugInfo.capture(2),
  equals?: Equal<T>,
): T {
  return calc(f, debug, equals).value;
}

export function flatCalc<T>(
  f: () => State<T>,
  debug = DebugInfo.capture(2),
): CalculatedState<T> {
  const state = calc(f, debug);
  return calc(() => state.value.value, debug);
}

/**
 * Run a function whenever the tracked dependents change.
 */
export function autorun(
  fn: () => void,
  debug = DebugInfo.capture(2),
): Reaction {
  return store(
    new CalculatedObservable(() => {
      try {
        return fn();
      } catch (e) {
        console.error(e);
        throw e;
      }
    }, debug),
  );
}
