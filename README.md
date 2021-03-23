# Rdataflow.js

Rdataflow is a JavaScript library for assembling computational processes.

It's like a spreadsheet calculator for your code.

## Install

```sh
npm add rdataflow
```

## Basic example

```js
import { calc } from "rdataflow/calc";
import { storeState } from "rdataflow/store";
import { WriteableState } from "rdataflow/write";

const redApples = WriteableState.value(5);
const greenApples = WriteableState.value(0);
const oranges = WriteableState.value(10);

const apples = calc(() => {
  const r = redApples.value;
  const g = greenApples.value;
  const sum = r + g;
  console.log(`${r} red apples + ${g} green apples = ${sum} apples`);
  return sum;
});

const fruit = calc(() => {
  const a = apples.value;
  const o = oranges.value;
  const sum = a + o;
  console.log(`${a} apples + ${o} oranges = ${sum} fruit`);
  return sum;
});

const store = storeState(output);
// 5 red apples + 0 green apples = 5 apples
// 5 apples + 10 oranges = 15 fruit

greenApples.setValue(10);
// 5 red apples + 5 gree apples = 10 apples
// 10 apples + 10 oranges = 20 fruit

oranges.setValue(6);
// 10 apples + 6 oranges = 16 fruit

store.dispose();
```

## Features

Rdataflow recomputes when inputs, caching results and errors. When computations
are no longer required, they are disposed of.

The implementation of Rdataflow is rather simple, yielding robustness and good
performance.

### calc()

`calc()` combines other states.

Because `calc()` is synchronous, no dependencies need be pre-declared outside
the calculation function itself.

### Transaction

Changes are applied transactionally, prevent unnecessary or inconsistent
calculations. If a transaction does not exist, it is created automatically.

### Observables

States can be converted to and from
[RxJS](https://rxjs-dev.firebaseapp.com/guide/overview) Observables.

```js
import { stateToRx } from "rdataflow/observable";
import { WriteableState } from "rdataflow/write";

const state = WriteableState.value(1);

const observable = stateToRx(state);
const subscription = observable.subscribe((state) => console.log(state));
// 1

state.setValue(2);
// 2

subscription.unsubscribe();
```
