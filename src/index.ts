type FieldKey = string | number | symbol;

/**
 * Base type for an FSM state.
 * `tag` value must be unique.
 */
export type FsmState = { tag: FieldKey };
/**
 * Base type for an FSM event.
 * `tag` value must be unique.
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
 *
 * @example
 * ```typescript
 * // This FSM shows how you can encode the state of a turnstile that takes coins
 * // and allows one person to walk through for each coin.
 *
 * type TurnstileState = {
 *   tag: 'empty_balance',
 * } | {
 *   tag: 'has_coins',
 *   balance: number,
 * }
 * type TurnstileEvents = {
 *   tag: 'insert_coins',
 *   numberOfCoinsInserted: number,
 * } | {
 *   tag: 'person_enters',
 * }
 *
 * const transitions = {
 *   // While we're in the 'empty_balance' state, we don't allow the 'person_enters' event.
 *   empty_balance: {
 *     insert_coins: (prev, event) => ({ tag: 'has_coins', balance: event.numberOfCoinsInserted }),
 *   },
 *   // Once we have coins we can allow the 'person_enters' event or allow people to add more coins.
 *   has_coins: {
 *     insert_coins: (prev, event) => ({ tag: 'has_coins', balance: prev.balance + event.numberOfCoinsInserted }),
 *     person_enters: (prev, event) => {
 *       const nextBalance = prev.balance - 1
 *       if (nextBalance === 0) return { tag: 'empty_balance'}
 *       else return { tag: 'has_coins', balance: nextBalance }
 *     }
 *   }
 * } satisifes TransitionLookup<TurnstileState, TurnstileEvents>;
 *
 * const turnstileFsm = new Fsm<TurnstileState, TurnstileEvents, typeof transitions>({ tag: 'awaiting_coins' }, transitions)
 * ```
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
