# wide-fsm

[docs](./docs/README.md)

![npm package minimized gzipped size](https://img.shields.io/bundlejs/size/wide-fsm)
![NPM Version](https://img.shields.io/npm/v/wide-fsm)

WideFSM is a strongly typed implementation of a finite state machine that uses discriminated unions for state and events.
What this means is you can pass arbitrary data in objects to your FSM and have it store more than just a state tag.

> :warning: Because WideFSM uses functions to transition from one state to another, and because `if` statements exist, 
> it has the potential to get pretty hairy if you have lots of conditionals between transitions.

## Turnstile 

Here's an example of the classic turnstile finite state machine. Except this turnstile is smart, it allows you to insert
more than one coin and tracks its own balance, something that wouldn't be possible with a regular finite state machine.

## Example

```typescript
// The turnstile can either be locked or unlocked
type TurnstileState = {
  tag: 'locked',
} | {
  tag: 'unlocked',
  balance: number,
}
// You can interact with the turnstile by inserting a coin
// or by walking through it.
type TurnstileEvents = {
  tag: 'insert_coins',
  numberOfCoinsInserted: number,
} | {
  tag: 'walk_through',
}

// This defines all of the transitions of the finite state machine.
const transitions = {
  locked: {
    insert_coins: (prev, event) => ({ tag: 'unlocked', balance: event.numberOfCoinsInserted }),
  },
  unlocked: {
    insert_coins: (prev, event) => ({ tag: 'unlocked', balance: prev.balance + event.numberOfCoinsInserted }),
    walk_through: (prev, event) => {
      const nextBalance = prev.balance - 1
      if (nextBalance === 0) return { tag: 'locked'}
      else return { tag: 'unlocked', balance: nextBalance }
    }
  }
} satisifes TransitionLookup<TurnstileState, TurnstileEvents>;

function main() {
  const turnstileFsm = new Fsm<TurnstileState, TurnstileEvents, typeof transitions>({ tag: 'locked' }, transitions)

  // Oh a turnstile.  What happens if I try to walk through it?
  let canIWalkThrough = turnstileFsm.canDispatch('walk_through')
  console.log(canIWalkThrough) // false

  // I must need to insert some coins.
  turnstileFsm.dispatch({ tag: 'insert_coins', numberOfCoinsInserted: 2 })

  // Lets try again... Looks like it is open now.
  canIWalkThrough = turnstileFsm.canDispatch('walk_through')
  console.log(canIWalkThrough) // true

  // I will walk through, and so will my friend...
  turnstileFsm.dispatch({ tag: 'walk_through' })
  turnstileFsm.dispatch({ tag: 'walk_through' })

  try {
    turnstileFsm.dispatch({ tag: 'walk_through' })
  } catch (error) {
    console.log('Ouch! It stopped moving.  The balance must be empty.')
  }
} 
```

## About

I wrote this to help create input controls with many states (i.e. click, drag, long press, click and drag when key is pressed)
where it ended up being really practical if I could store some extra data along with my state (i.e. when the mouse is dragging
I want to know the point where it started dragging as well as its current position).

The `Fsm` class is generic, not only over the state/events that you pass in, but also over the `TransitionLookup` object.
This means that transitions handlers and that the `onTransition(...)` callbacks will have their arguments typed.

The down-side is that it's a little verbose, having to seperate the `transitions` into their own object that 
`satisifes TransitionLookup<States, Events>`.

## Contributing

Install dependencies, make your change, run `npm run test` and then `npm run docs`. Let me know if you can find a way to avoid
having to define the `transitions` argument seperately :) 

## Acknowledgements / Similar

Thanks [typescript-fsm](https://github.com/eram/typescript-fsm) for another great FSM implementation in typescript.
