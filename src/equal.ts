export interface Equal<T> {
  /**
   * Return whether the values are equal
   */
  (a: T, b: T): boolean;
}

export namespace Equal {
  export function array<T>(element: Equal<T>): Equal<T[]> {
    return (a, b) => {
      for (let i = 0; i < a.length || i < b.length; i++) {
        if (a.length <= i || b.length <= i) {
          return false;
        }
        if (!element(a[i], b[i])) {
          return false;
        }
      }
      return true;
    };
  }

  export function identity<T>(): Equal<T> {
    return Object.is;
  }

  export function object<T>(
    properties: {
      [K in keyof T]?: Equal<T[K]>;
    },
  ): Equal<T> {
    return (a: T, b: T) => {
      return Object.entries(properties).every(([key, equal]: [any, any]) =>
        equal(a[<keyof T>key], b[<keyof T>key]),
      );
    };
  }
}
