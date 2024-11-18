/**
 * @packageDocumentation
 *
 * WideFSM is a strongly typed implementation of a finite state machine that uses discriminated unions for state and events.
 * What this means is you can pass arbitrary data in objects to your FSM and have it store more than just a state tag.
 *
 * > :warning: Because WideFSM uses functions to transition from one state to another, and because `if` statements exist, 
 * > it has the potential to get pretty hairy if you have lots of conditionals between transitions.
 *
 * ## Turnstile
 *
 * Here's an example of the classic turnstile finite state machine. Except this turnstile is smart, it allows you to insert
 * more than one coin and tracks its own balance, something that wouldn't be possible with a regular finite state machine.
 *
 * @example
 * ```typescript
 *
 * // The turnstile can either be locked or unlocked
 * type TurnstileState = {
 *   tag: 'locked',
 * } | {
 *   tag: 'unlocked',
 *   balance: number,
 * }
 *
 * // You can interact with the turnstile by inserting a coin
 * // or by walking through it.
 * type TurnstileEvents = {
 *   tag: 'insert_coins',
 *   numberOfCoinsInserted: number,
 * } | {
 *   tag: 'walk_through',
 * }
 *
 * // This defines all of the transitions of the finite state machine.
 * const transitions = {
 *   locked: {
 *     insert_coins: (prev, event) => ({ tag: 'unlocked', balance: event.numberOfCoinsInserted }),
 *   },
 *   unlocked: {
 *     insert_coins: (prev, event) => ({ tag: 'unlocked', balance: prev.balance + event.numberOfCoinsInserted }),
 *     walk_through: (prev, event) => {
 *       const nextBalance = prev.balance - 1
 *       if (nextBalance === 0) return { tag: 'locked'}
 *       else return { tag: 'unlocked', balance: nextBalance }
 *     }
 *   }
 * } satisifes TransitionLookup<TurnstileState, TurnstileEvents>;
 *
 *
 * function main() {
 *   const turnstileFsm = new Fsm<TurnstileState, TurnstileEvents, typeof transitions>({ tag: 'locked' }, transitions)
 *
 *   // Oh a turnstile.  What happens if I try to walk through it?
 *   const canIWalkThrough = turnstileFsm.canDispatch('walk_through')
 *   console.log(canIWalkThrough) // false
 *
 *   // I must need to insert some coins.
 *   turnstileFsm.dispatch({ tag: 'insert_coins', numberOfCoinsInserted: 2 })
 *
 *   // Lets try again... Looks like it is open now.
 *   const canIWalkThrough = turnstileFsm.canDispatch('walk_through')
 *   console.log(canIWalkThrough) // true
 *
 *   // I will walk through, and so will my friend...
 *   turnstileFsm.dispatch({ tag: 'walk_through' })
 *   turnstileFsm.dispatch({ tag: 'walk_through' })
 *
 *   try {
 *     turnstileFsm.dispatch({ tag: 'walk_through' })
 *   } catch (error) {
 *     console.log('Ouch! It stopped moving.  The balance must be empty.')
 *   }
 * } 
 * ```
 *
 * ## About
 *
 * I wrote this to help create input controls with many states (i.e. click, drag, long press, click and drag when key is pressed)
 * where it ended up being really practical if I could store some extra data along with my state (i.e. when the mouse is dragging
 * I want to know the point where it started dragging as well as its current position).
 *
 * The `Fsm` class is generic, not only over the state/events that you pass in, but also over the `TransitionLookup` object.
 * This means that transitions handlers and that the `onTransition(...)` callbacks will have their arguments typed.
 * 
 * The down-side is that it's a little verbose, having to seperate the `transitions` into their own object that 
 * `satisifes TransitionLookup<States, Events>`.
 */

/**
 * Represents any value that can be used as the key of an object.
 */
type FieldKey = string | number | symbol;

/**
 * Base type for a state within your FSM.
 */
export type FsmState = { tag: FieldKey };
/**
 * Base type for an event for your FSM.
 */
export type FsmEvent = { tag: FieldKey };

/**
 * Given a state and an event, transitions the FSM to another state.
 */
export type FsmTransition<
    TStateIn extends FsmState,
    TEvent extends FsmEvent,
    TStateOut extends FsmState,
> = (current: TStateIn, event: TEvent) => TStateOut;

/**
 * Defines the transitions of your FSM.  
 */
export type TransitionLookup<
    TState extends FsmState,
    TEvent extends FsmEvent,
> = Partial<{
    [KState in TState["tag"]]: Partial<{
        [KEvent in TEvent["tag"]]: FsmTransition<
            Extract<TState, { tag: KState }>,
            Extract<TEvent, { tag: KEvent }>,
            TState
        >;
    }>;
}>;

type OnTransitionHandler<
    TState extends FsmState,
    TEvent extends FsmEvent,
    TTransitionLookup extends TransitionLookup<TState, TEvent>,
    KState extends keyof TTransitionLookup,
    KEvent extends keyof TTransitionLookup[KState],
> = (
    prev: Extract<TState, { tag: KState }>,
    event: Extract<TEvent, { tag: KEvent }>,
    curr: ReturnType<NonNullable<NonNullable<TTransitionLookup[KState]>[KEvent]>>,
) => void;

type OnTransitionLookup<
    TState extends FsmState,
    TEvent extends FsmEvent,
    TTransitionLookup extends TransitionLookup<TState, TEvent>,
> = Partial<{
    [KState in keyof TTransitionLookup]: Partial<{
        [KEvent in keyof TTransitionLookup[KState]]: Set<
            OnTransitionHandler<TState, TEvent, TTransitionLookup, KState, KEvent>
        >;
    }>;
}>;

/**
 * Implementation of an FSM that allows you to use objects with a discriminating tag for state/events.
 */
export class Fsm<
    TState extends FsmState,
    TEvent extends FsmEvent,
    TTransitionLookup extends TransitionLookup<TState, TEvent>,
> {
    constructor(
        public state: TState,
        private transitions: TTransitionLookup,
    ) { }

    /**
     * Gets a cloned copy of the current state of the FSM.
     */
    getState(): TState {
        return structuredClone(this.state);
    }

    /**
     * Gets a reference to the internal state of the FSM.
     * You've got to be careful that you don't mutate the object or bad things could happen to your FSM.
     */
    getInternalState(): TState {
        return this.state;
    }

    /**
     * Allows you to set the internal state of the FSM.
     * Generally you should never need to do this.
     */
    setInternalState(state: TState) {
        this.state = state;
    }

    /**
     * Returns a transition handler for a given state + event combination or undefined if it doesn't exist.
     */
    private getTransitionHandler<
        KState extends TState["tag"],
        KEvent extends TState["tag"],
    >(stateTag: KState, eventTag: KEvent) {
        const events = this.transitions[stateTag];
        if (!events) return undefined;
        return events[eventTag];
    }

    /**
     * Returns true if the FSM is in a "final" state, where the are no transitions out to other states.
     */
    isFinalState() {
        const events = this.transitions[this.state.tag as TState["tag"]];
        return !events || Object.keys(events).length === 0;
    }

    /**
     * Returns true if the FSM is able to dispatch an event from its current state.
     */
    canDispatch(eventTag: TEvent["tag"]) {
        const transition = this.getTransitionHandler(this.state.tag, eventTag);
        return !!transition;
    }

    /**
     * Dispatches an event, transitioning the FSM to another state.
     * This will notify `onTransition` and `onStateChange` callbacks.
     * @throws If no transtion from the current state exists.
     */
    dispatch(event: TEvent) {
        const transition = this.getTransitionHandler(
            this.state.tag,
            event.tag,
        ) as FsmTransition<TState, TEvent, TState>;

        if (!transition) {
            const events = this.transitions[this.state.tag as TState["tag"]];
            const extraMessage = events
                ? `Valid events in this state are ${Object.keys(events)
                    .map((tag) => `"${String(tag)}"`)
                    .join(", ")}.`
                : `There are no transitions out of the "${String(this.state.tag)}" state.`;
            throw new Error(
                [
                    `Fsm tried to dispatch the "${String(event.tag)}" while in the "${String(this.state.tag)}" state but no transitions exist for this combination.`,
                    extraMessage,
                    "You can check if you can dispatch an event by using `canDispatch(event)` to conditionally dispatch it.",
                ].join("\n"),
            );
        }

        const prevState = this.state;
        this.state = transition(prevState, event) as TState;

        for (const listener of this.onStateChangeListeners) {
            listener(prevState, this.state);
        }

        // @ts-expect-error; OnTransitionHandler expects a TState to be a concrete type, not the union.
        const listeners = this.onTransitionLookup[prevState.tag as TState["tag"]]?.[
            event.tag as TEvent["tag"]
            ];
        if (listeners) {
            for (const listener of listeners) {
                listener(prevState, event, this.state);
            }
        }
    }

    onStateChangeListeners = new Set<(prev: TState, next: TState) => void>();
    /**
     * Listen for state changes.  This will run before `onTransition` callbacks.
     * @returns A function to stop listening.
     */
    onStateChange(callback: (prev: TState, next: TState) => void) {
        this.onStateChangeListeners.add(callback);
        return () => this.offStateChange(callback);
    }
    /**
     * Stops listening for state changes.
     */
    offStateChange(callback: (prev: TState, next: TState) => void) {
        this.onStateChangeListeners.delete(callback);
    }

    private onTransitionLookup: OnTransitionLookup<
        TState,
        TEvent,
        TTransitionLookup
    > = {};
    private getOnTransitionListeners<
        KState extends keyof TTransitionLookup,
        KEvent extends keyof TTransitionLookup[KState],
    >(
        stateKey: KState,
        eventKey: KEvent,
    ): Set<
        OnTransitionHandler<TState, TEvent, TTransitionLookup, KState, KEvent>
    > {
        if (!this.onTransitionLookup[stateKey])
            this.onTransitionLookup[stateKey] = {};
        const eventLookup = this.onTransitionLookup[stateKey]!;
        if (!eventLookup[eventKey]) eventLookup[eventKey] = new Set();
        return eventLookup[eventKey];
    }

    /**
     * Listens for a transition from a state with a given event.
     * @returns A function to stop listening for this transition.
     */
    onTransition<
        KState extends keyof TTransitionLookup,
        KEvent extends keyof TTransitionLookup[KState],
    >(
        stateKey: KState,
        eventKey: KEvent,
        callback: OnTransitionHandler<
            TState,
            TEvent,
            TTransitionLookup,
            KState,
            KEvent
        >,
    ) {
        this.getOnTransitionListeners(stateKey, eventKey).add(callback);
        return () => this.offTransition(stateKey, eventKey, callback);
    }

    /**
     * Stops listening for transitions.
     */
    offTransition<
        KState extends keyof TTransitionLookup,
        KEvent extends keyof TTransitionLookup[KState],
    >(
        stateKey: KState,
        eventKey: KEvent,
        callback: OnTransitionHandler<
            TState,
            TEvent,
            TTransitionLookup,
            KState,
            KEvent
        >,
    ) {
        this.getOnTransitionListeners(stateKey, eventKey).delete(callback);
    }

    /**
     * Returns a new clone of this FSM.  Copies the current state across.
     * @returns
     */
    clone() {
        return new Fsm<TState, TEvent, TTransitionLookup>(
            this.state,
            this.transitions,
        );
    }
}
