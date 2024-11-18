[**wide-fsm**](../README.md) • **Docs**

***

[wide-fsm](../README.md) / Fsm

# Class: Fsm\<TState, TEvent, TTransitionLookup\>

Implementation of an FSM that allows you to use objects with a discriminating tag for state/events.

## Type Parameters

• **TState** *extends* [`FsmState`](../type-aliases/FsmState.md)

• **TEvent** *extends* [`FsmEvent`](../type-aliases/FsmEvent.md)

• **TTransitionLookup** *extends* [`TransitionLookup`](../type-aliases/TransitionLookup.md)\<`TState`, `TEvent`\>

## Constructors

### new Fsm()

> **new Fsm**\<`TState`, `TEvent`, `TTransitionLookup`\>(`state`, `transitions`): [`Fsm`](Fsm.md)\<`TState`, `TEvent`, `TTransitionLookup`\>

#### Parameters

• **state**: `TState`

• **transitions**: `TTransitionLookup`

#### Returns

[`Fsm`](Fsm.md)\<`TState`, `TEvent`, `TTransitionLookup`\>

#### Defined in

index.ts:156

## Properties

### onStateChangeListeners

> **onStateChangeListeners**: `Set`\<(`prev`, `next`) => `void`\>

#### Defined in

index.ts:257

***

### state

> **state**: `TState`

#### Defined in

index.ts:157

## Methods

### canDispatch()

> **canDispatch**(`eventTag`): `boolean`

Returns true if the FSM is able to dispatch an event from its current state.

#### Parameters

• **eventTag**: `TEvent`\[`"tag"`\]

#### Returns

`boolean`

#### Defined in

index.ts:207

***

### clone()

> **clone**(): [`Fsm`](Fsm.md)\<`TState`, `TEvent`, `TTransitionLookup`\>

Returns a new clone of this FSM.  Copies the current state across.

#### Returns

[`Fsm`](Fsm.md)\<`TState`, `TEvent`, `TTransitionLookup`\>

#### Defined in

index.ts:340

***

### dispatch()

> **dispatch**(`event`): `void`

Dispatches an event, transitioning the FSM to another state.
This will notify `onTransition` and `onStateChange` callbacks.

#### Parameters

• **event**: `TEvent`

#### Returns

`void`

#### Throws

If no transtion from the current state exists.

#### Defined in

index.ts:217

***

### getInternalState()

> **getInternalState**(): `TState`

Gets a reference to the internal state of the FSM.
You've got to be careful that you don't mutate the object or bad things could happen to your FSM.

#### Returns

`TState`

#### Defined in

index.ts:172

***

### getState()

> **getState**(): `TState`

Gets a cloned copy of the current state of the FSM.

#### Returns

`TState`

#### Defined in

index.ts:164

***

### isFinalState()

> **isFinalState**(): `boolean`

Returns true if the FSM is in a "final" state, where the are no transitions out to other states.

#### Returns

`boolean`

#### Defined in

index.ts:199

***

### offStateChange()

> **offStateChange**(`callback`): `void`

Stops listening for state changes.

#### Parameters

• **callback**

#### Returns

`void`

#### Defined in

index.ts:269

***

### offTransition()

> **offTransition**\<`KState`, `KEvent`\>(`stateKey`, `eventKey`, `callback`): `void`

Stops listening for transitions.

#### Type Parameters

• **KState** *extends* `string` \| `number` \| `symbol`

• **KEvent** *extends* `string` \| `number` \| `symbol`

#### Parameters

• **stateKey**: `KState`

• **eventKey**: `KEvent`

• **callback**: `OnTransitionHandler`\<`TState`, `TEvent`, `TTransitionLookup`, `KState`, `KEvent`\>

#### Returns

`void`

#### Defined in

index.ts:319

***

### onStateChange()

> **onStateChange**(`callback`): () => `void`

Listen for state changes.  This will run before `onTransition` callbacks.

#### Parameters

• **callback**

#### Returns

`Function`

A function to stop listening.

##### Returns

`void`

#### Defined in

index.ts:262

***

### onTransition()

> **onTransition**\<`KState`, `KEvent`\>(`stateKey`, `eventKey`, `callback`): () => `void`

Listens for a transition from a state with a given event.

#### Type Parameters

• **KState** *extends* `string` \| `number` \| `symbol`

• **KEvent** *extends* `string` \| `number` \| `symbol`

#### Parameters

• **stateKey**: `KState`

• **eventKey**: `KEvent`

• **callback**: `OnTransitionHandler`\<`TState`, `TEvent`, `TTransitionLookup`, `KState`, `KEvent`\>

#### Returns

`Function`

A function to stop listening for this transition.

##### Returns

`void`

#### Defined in

index.ts:298

***

### setInternalState()

> **setInternalState**(`state`): `void`

Allows you to set the internal state of the FSM.
Generally you should never need to do this.

#### Parameters

• **state**: `TState`

#### Returns

`void`

#### Defined in

index.ts:180
