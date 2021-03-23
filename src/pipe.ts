export function compose(...f: ((value: any) => any)[]): (value: any) => any {
  return (value) => f.reduce((result, f) => f(result), value);
}

export abstract class Pipeable {
  /**
   * Apply operators
   */
  pipe(): this;
  pipe<B>(a: (value: this) => B): B;
  pipe<B, C>(a: (value: this) => B, b: (value: B) => C): C;
  pipe<B, C>(
    a: (value: this) => B,
    b: (value: B) => C,
    c: (value: C) => any,
    ...rest: ((value: any) => any)[]
  ): any;
  pipe(...f: ((value: any) => any)[]) {
    return compose(...f)(this);
  }
}
