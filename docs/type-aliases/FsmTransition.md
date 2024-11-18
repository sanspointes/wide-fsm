[**wide-fsm**](../README.md) • **Docs**

***

[wide-fsm](../README.md) / FsmTransition

# Type Alias: FsmTransition()\<TStateIn, TEvent, TStateOut\>

> **FsmTransition**\<`TStateIn`, `TEvent`, `TStateOut`\>: (`current`, `event`) => `TStateOut`

Given a state and an event, transitions the FSM to another state.

## Type Parameters

• **TStateIn** *extends* [`FsmState`](FsmState.md)

• **TEvent** *extends* [`FsmEvent`](FsmEvent.md)

• **TStateOut** *extends* [`FsmState`](FsmState.md)

## Parameters

• **current**: `TStateIn`

• **event**: `TEvent`

## Returns

`TStateOut`

## Defined in

index.ts:102
