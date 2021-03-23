import { Equal } from "./equal";

/**
 * Result
 */
export type Result<T> = Result.Value<T> | Result.Error;

export namespace Result {
  /**
   * Success
   */
  export class Value<T> {
    constructor(readonly value: T) {}

    getValue() {
      return this.value;
    }

    static equal<T>(valueEquals: Equal<T>): Equal<Value<T>> {
      return Equal.object({ value: valueEquals });
    }
  }

  /**
   * Error
   */
  export class Error {
    constructor(readonly error: any) {}

    getValue(): never {
      throw this.error;
    }

    static EQUAL: Equal<Error> = Equal.object({ error: Equal.identity() });
  }

  export function equal<T>(valueEquals: Equal<T>): Equal<Result<T>> {
    const errorEquals = Error.EQUAL;
    const valueEquals_ = Value.equal(valueEquals);
    return (a, b) => {
      if (a === b) {
        return true;
      }
      if (a instanceof Result.Error) {
        return b instanceof Result.Error && errorEquals(a, b);
      }
      return b instanceof Result.Value && valueEquals_(a, b);
    };
  }

  export function run<T>(f: () => T): Result<T> {
    try {
      const result = f();
      return new Result.Value(result);
    } catch (e) {
      return new Result.Error(e);
    }
  }
}
