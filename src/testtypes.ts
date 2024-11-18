import { Fsm, FsmState, TransitionLookup } from ".";

type MyState =
    | {
        tag: "on";
    }
    | {
        tag: "off";
    };

type MyEvent =
    | {
        tag: "switch_on";
    }
    | { tag: "switch_off" }
    | { tag: "toggle" };

const transitions = {
    on: {
        switch_off: (_prev, _ev) => ({ tag: "off" }),
        toggle: (_prev, _ev) => ({ tag: "off" }),
    },
    off: {
        switch_on: (_prev, _ev) => ({ tag: "on" }),
        toggle: (_prev, _ev) => ({ tag: "on" }),
    },
} satisfies TransitionLookup<MyState, MyEvent>;

const fsm = new Fsm<MyState, MyEvent, typeof transitions>({ tag: 'off' }, transitions);

type Expect<T extends true> = T;

type Is<T, O> = T extends O ? true : false
type Or<T, O> = T extends true ? true : O extends true ? true : false

// Check that `onTransition` infers the previous state, event and next state correctly.
fsm.onTransition('off', 'switch_on', (prev, ev, next) => {
    // Prev state from first argument
    type t1 = Expect<Is<typeof prev, { tag: 'off' }>>
    // Event from second argument
    type t2 = Expect<Is<typeof ev, { tag: 'switch_on' }>>
    // Next state inferred from `TransitionLookup`
    type t3 = Expect<Is<typeof next, { tag: 'on' }>>
})

fsm.onStateChange((prev, next) => {
    // Prev state from first argument
    type t1 = Expect<Is<typeof prev, MyState>>
    type t2 = Expect<Is<typeof next, MyState>>
})
