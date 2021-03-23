import { calc } from "./calc";
import { State } from "./core";
import { WriteableState } from "./write";

interface CachedState<A, B> {
  state: State<B>;
  item: WriteableState<A>;
  index: WriteableState<number>;
}

/**
 * Map each element to a state and re-flatten those to array.
 */
export function arrayMap<A, B, K>(
  fn: (a: State<A>, index: State<number>, key: K) => State<B>,
  keyFn: (a: A) => K = (a: A) => <K>(<unknown>a),
): (a: State<A[]>) => State<B[]> {
  return (array) => {
    let cache = new Map<K, CachedState<A, B>>();
    return calc(() => {
      const newCache: typeof cache = new Map();
      try {
        return array.value.map((item, i) => {
          const key = keyFn(item);
          let cached = cache.get(key);
          if (cached) {
            cached.item.setValue(item);
            cached.index.setValue(i);
          } else {
            const itemState = WriteableState.value(item);
            const indexState = WriteableState.value(i);
            cached = {
              state: fn(itemState, indexState, key),
              item: itemState,
              index: indexState,
            };
          }
          newCache.set(key, cached);
          return cached.state.value;
        });
      } finally {
        cache = newCache;
      }
    });
  };
}
