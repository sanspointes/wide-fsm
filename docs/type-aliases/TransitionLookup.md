[**wide-fsm**](../README.md) • **Docs**

***

[wide-fsm](../README.md) / TransitionLookup

# Type Alias: TransitionLookup\<TState, TEvent\>

> **TransitionLookup**\<`TState`, `TEvent`\>: `Partial`\<`{ [KState in TState["tag"]]: Partial<{ [KEvent in TEvent["tag"]]: FsmTransition<Extract<TState, Object>, Extract<TEvent, Object>, TState> }> }`\>

Defines the transitions of your FSM.

## Type Parameters

• **TState** *extends* [`FsmState`](FsmState.md)

• **TEvent** *extends* [`FsmEvent`](FsmEvent.md)

## Defined in

index.ts:111
