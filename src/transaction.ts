/**
 * Transaction
 */
export class Transaction {
  private afterHooks: TransactionHook[] = [];

  registerEnd(hook: TransactionHook) {
    this.afterHooks.push(hook);
  }

  /**
   * Run in current or new transaction.
   */
  run<T>(f: () => T): T {
    try {
      return f();
    } finally {
      while (this.afterHooks.length) {
        const afterHooks = this.afterHooks;
        this.afterHooks = [];
        for (const hook of afterHooks) {
          hook();
        }
      }
    }
  }

  private static _current: Transaction | undefined;

  static get current(): Transaction {
    if (!this._current) {
      throw new NoTransactionError();
    }
    return this._current;
  }

  static run<T>(f: () => T) {
    if (this._current) {
      return f();
    } else {
      this._current = new Transaction();
      try {
        return this._current.run(f);
      } finally {
        this._current = undefined;
      }
    }
  }

  static registerEnd(hook: TransactionHook) {
    if (!this._current) {
      hook();
    } else {
      this._current.registerEnd(hook);
    }
  }
}

export class NoTransactionError extends Error {
  constructor() {
    super("Not currently running transaction");
  }
}

/**
 * Tranasction hook
 */
export interface TransactionHook {
  (): void;
}

export class TransactionScheduler {
  constructor(f: () => void) {
    this.hook = () => {
      if (!this.scheduled) {
        return;
      }
      this.scheduled = false;
      f();
    };
  }

  private readonly hook: () => void;
  private scheduled = false;

  schedule() {
    if (this.scheduled) {
      return;
    }
    this.scheduled = true;
    Transaction.registerEnd(this.hook);
  }

  unschedule() {
    this.scheduled = false;
  }
}

export function runAction<T>(f: () => T): T {
  return Transaction.run(f);
}
