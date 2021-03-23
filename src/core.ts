import { DebugInfo } from "./debug";
import { Pipeable } from "./pipe";
import { Result } from "./result";

export interface ContextListener {
  observed(state: StateObservable<unknown>, track: boolean): void;
}

export class DefaultContextListener implements ContextListener {
  observed() {
    // console.warn(new Error('Called outside state context'));
  }
}

/**
 * Track observed values
 */
export namespace Context {
  export var listener: ContextListener = new DefaultContextListener();

  export function run<T>(l: ContextListener, fn: () => T) {
    const old = listener;
    listener = l;
    try {
      return fn();
    } finally {
      listener = old;
    }
  }
}

/**
 * Trackable observable
 */
export abstract class State<T> extends Pipeable {
  /** Observable */
  abstract readonly observable: StateObservable<T>;

  /** Read and track */
  get value(): T {
    Context.listener.observed(this.observable, true);
    return this.observable.result.getValue();
  }

  /** Read but don't track */
  get current(): T {
    Context.listener.observed(this.observable, false);
    return this.observable.result.getValue();
  }
}

/**
 * Observable state
 */
export interface StateObservable<T> {
  /** Recalculate */
  calc(): void;

  /** Result */
  readonly result: Result<T>;

  /** Subscribe to changes */
  subscribe(listener: StateListener): StateSubscription;
}

export interface StateListener {
  /** State changed */
  changed(source: DebugInfo): void;
  /** State may have changed */
  dirty(source: DebugInfo): void;
}

export interface StateSubscription {
  unsubscribe(): void;
}

export interface Reaction {
  /** Stop tracking */
  dispose(): void;
}
