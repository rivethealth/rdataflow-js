# Rdataflow

![npm](https://img.shields.io/npm/v/rdataflow)

<p align="center">
  <img src="doc/logo.png">
</p>

Rdataflow is a JavaScript library for assembling computational processes.

It's like a spreadsheet calculator for your code.

## Install

```sh
npm add rdataflow
```

## Basic example

```js
import { autorun, calc } from "rdataflow/calc";
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

const run = autorun(() => {
  fruit.value;
});
// 5 red apples + 0 green apples = 5 apples
// 5 apples + 10 oranges = 15 fruit

greenApples.setValue(10);
// 5 red apples + 5 green apples = 10 apples
// 10 apples + 10 oranges = 20 fruit

oranges.setValue(6);
// 10 apples + 6 oranges = 16 fruit

run.dispose();
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

Changes happen in transactions, which prevent unnecessary or inconsistent
calculations. `runAction()` runs the callback in a transaction.

```js
import { autorun } from "rdataflow/calc";
import { runAction } from "rdataflow/transaction";
import { WriteableState } from "rdataflow/write";

const a = WriteableState.value(0);
const b = WriteableState.value(0);

const run = autorun(() => console.log(a.value + b.value));
// 0

runAction(() => {
  a.setValue(1);
  b.setValue(2);
});
// 3

run.dispose();
```

If a transaction does not already exist, it is created automatically.

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
