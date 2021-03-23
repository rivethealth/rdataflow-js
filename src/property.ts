import { Equal } from "./equal";
import { calc } from "./calc";
import { WriteableState } from "./write";

interface Property<T> {
  get(target: Object): T;
}

namespace Property {
  export function chain<T>(first: Property<any>, second: Property<T>) {
    return new ChainedProperty(first, second);
  }
}

class ChainedProperty<T> implements Property<T> {
  constructor(
    private readonly first: Property<any>,
    private readonly second: Property<T>
  ) {}

  get(target: Object) {
    return this.second.get(this.first.get(target));
  }
}

class ObjectProperty<T> implements Property<T> {
  constructor(
    private readonly key: string | symbol,
    private readonly create: () => T
  ) {}

  get(target: Object): T {
    let value: T;
    if (this.key in target) {
      value = (<any>target)[this.key];
    } else {
      value = this.create();
      (<any>target)[this.key] = value;
    }
    return value;
  }
}

interface StateInfo {
  [key: string]: any;
}

const STATE_INFO_PROPERTY = new ObjectProperty<StateInfo>(
  Symbol("STATE_INFO"),
  () => ({})
);

export class InvalidPropertyError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export function calculated<T>(equals?: Equal<T>) {
  return (target: Object, key: string) => {
    const initial = Object.getOwnPropertyDescriptor(target, key);
    if (!initial || !initial.get) {
      throw new InvalidPropertyError(`Getter ${key} does not exist`);
    }

    const getter = initial.get;
    const keyProperty = new ObjectProperty(key, () =>
      calc<T>(getter, undefined, equals)
    );

    const property = Property.chain(STATE_INFO_PROPERTY, keyProperty);

    Object.defineProperty(target, key, {
      get(): T {
        return property.get(this).value;
      },
    });
  };
}

export function observable<T>(equals?: Equal<T>) {
  return (target: Object, key: string) => {
    const initial = Object.getOwnPropertyDescriptor(target, key);

    const value = initial && initial.value;
    const keyProperty = new ObjectProperty(key, () =>
      WriteableState.value<T>(value, equals)
    );

    const property = Property.chain(STATE_INFO_PROPERTY, keyProperty);

    Object.defineProperty(target, key, {
      get(): T {
        return property.get(this).value;
      },
      set(value: T) {
        property.get(this).setValue(value);
      },
    });
  };
}
