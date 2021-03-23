import { Reaction, State, StateObservable, StateSubscription } from "./core";
import { Result } from "./result";
import { runAction, TransactionScheduler } from "./transaction";

export class DisposedReactionError extends Error {
  constructor() {
    super("Disposed reaction");
  }
}

/**
 * Side effect
 */
export class StateReaction<T> implements Reaction {
  constructor(private readonly observable: StateObservable<T>) {
    this.subscription = observable.subscribe({
      changed() {},
      dirty: () => this.scheduler.schedule(),
    });
    this.scheduler.schedule();
  }

  private subscription: StateSubscription | undefined;

  private readonly scheduler = new TransactionScheduler(() => {
    this.observable.calc();
    if (this.observable.result instanceof Result.Error) {
      console.error(this.observable.result.error);
    }
  });

  /**
   * Get the current value
   */
  get value(): T {
    if (!this.subscription) {
      throw new DisposedReactionError();
    }
    return this.observable.result.getValue();
  }

  /**
   * Stop tracking
   */
  dispose() {
    runAction(() => {
      this.subscription!.unsubscribe();
      this.subscription = undefined;
    });
  }
}

/**
 * Store the observable
 */
export function store<T>(observable: StateObservable<T>) {
  return runAction(() => new StateReaction(observable));
}

/**
 * Store the observable
 */
export function storeState<T>(state: State<T>) {
  return store(state.observable);
}
