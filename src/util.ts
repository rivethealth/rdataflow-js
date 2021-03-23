import { Equal } from "./equal";
import { StateListener, StateSubscription } from "./core";
import { DebugInfo } from "./debug";
import { Result } from "./result";

export interface ManagerLifecycle {
  activate(): void;
  deactivate(): void;
  change(): void;
}

/**
 * Manage value and listeners
 */
export class Manager<T> {
  constructor(
    private result: Result<T>,
    valueEquals: Equal<T>,
    private readonly lifecycle: ManagerLifecycle,
    private readonly debugInfo: DebugInfo
  ) {
    this.equals = Result.equal(valueEquals);
  }

  private readonly equals: Equal<Result<T>>;
  private readonly listeners = new Map<number, StateListener>();

  private subscriptionId = 0;

  get() {
    return this.result;
  }

  /** Mark as changed */
  changed() {
    for (const listener of this.listeners.values()) {
      listener.changed(this.debugInfo);
    }
  }

  /** Mark as dirty */
  dirty() {
    for (const listener of this.listeners.values()) {
      listener.dirty(this.debugInfo);
    }
  }

  /** Subscribe */
  subscribe(listener: StateListener): StateSubscription {
    if (!this.listeners.size) {
      this.lifecycle.activate();
    }
    const id = this.subscriptionId++;
    this.listeners.set(id, listener);
    return {
      unsubscribe: () => {
        this.listeners.delete(id);
        if (!this.listeners.size) {
          this.lifecycle.deactivate();
        }
      },
    };
  }

  /** Set result */
  set(result: Result<T>) {
    if (this.equals(this.result, result)) {
      return;
    }
    this.result = result;
    if (this.listeners.size) {
      this.lifecycle.change();
    }
  }
}
