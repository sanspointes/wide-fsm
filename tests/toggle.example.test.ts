import { TransitionLookup } from "../dist";
import { Fsm } from "../src";

// This defines each state that your FSM can be.
type ToggleState =
    | {
        tag: "on";
    }
    | {
        tag: "off";
    };

// This defines all of the events your FSM can handle.
type ToggleEvent =
    | {
        tag: "switch_on";
    }
    | {
        tag: "switch_off";
    }
    | {
        tag: "toggle";
    };

// This is a lookup map from a given state and event to a transition handler.
// The transition handler returns the next state of the fsm.
const transitions = {
    on: {
        // In the 'on' state, when the 'switch_off' event is received, transition to the 'off' state.
        switch_off: (_prev, _ev) => ({ tag: "off" }),
        toggle: (_prev, _ev) => ({ tag: "off" }),
    },
    off: {
        switch_on: (_prev, _ev) => ({ tag: "on" }),
        // In the 'off' state, when the 'toggle' event is received, transition to the 'on' state.
        toggle: (_prev, _ev) => ({ tag: "on" }),
    },
} satisfies TransitionLookup<ToggleState, ToggleEvent>;

const buildToggleFsm = (initialState: ToggleState) => {
    return new Fsm<ToggleState, ToggleEvent, typeof transitions>(
        initialState,
        transitions,
    );
};

describe("Toggle Fsm Smoketest", () => {
    it("switches on (transitions when possible)", () => {
        const toggleFsm = buildToggleFsm({ tag: "off" });

        toggleFsm.dispatch({ tag: "switch_on" });
        expect(toggleFsm.getState()).toEqual({ tag: "on" });
    });

    it("throws an error if switched on while already on (error when no transition)", () => {
        const toggleFsm = buildToggleFsm({ tag: "on" });

        expect(() => {
            toggleFsm.dispatch({ tag: "switch_on" });
        }).toThrow();
    });

    it("switches off (transitions when possible)", () => {
        const toggleFsm = buildToggleFsm({ tag: "on" });

        toggleFsm.dispatch({ tag: "switch_off" });
        expect(toggleFsm.getState()).toEqual({ tag: "off" });
    });

    it("throws an error if switched off while already off (error when no transition)", () => {
        const toggleFsm = buildToggleFsm({ tag: "on" });

        expect(() => {
            toggleFsm.dispatch({ tag: "switch_on" });
        }).toThrow();
    });

    it("toggles", () => {
        const toggleFsm = buildToggleFsm({ tag: "off" });

        toggleFsm.dispatch({ tag: "toggle" });
        expect(toggleFsm.getState()).toEqual({ tag: "on" });
        toggleFsm.dispatch({ tag: "toggle" });
        expect(toggleFsm.getState()).toEqual({ tag: "off" });
    });

    it("allows you to check for valid transitions using `canDispatch`", () => {
        const toggleFsm = buildToggleFsm({ tag: "off" });

        expect(toggleFsm.canDispatch("switch_off")).toEqual(false);
        expect(toggleFsm.canDispatch("switch_on")).toEqual(true);

        toggleFsm.dispatch({ tag: "switch_on" });

        expect(toggleFsm.canDispatch("switch_off")).toEqual(true);
        expect(toggleFsm.canDispatch("switch_on")).toEqual(false);
    });

    describe("getState()", () => {
        it("returns the current state", () => {
            const toggleFsm = buildToggleFsm({ tag: "off" });
            expect(toggleFsm.getState()).toEqual({ tag: "off" });
            toggleFsm.dispatch({ tag: "switch_on" });
            expect(toggleFsm.getState()).toEqual({ tag: "on" });
        });

        it("returns a clone, not a reference, to the state. ", () => {
            const toggleFsm = buildToggleFsm({ tag: "off" });
            const state1 = toggleFsm.getState();
            const state2 = toggleFsm.getState();

            expect(state1).toEqual(state2);
            expect(state1).not.toBe(state2);

            state1.tag = 'on'
            expect(state1).not.toEqual(state2);
            expect(state1).not.toBe(state2);
        });
    });

    describe("clone()", () => {
        it("returns a clone of the FSM with its own internal state.", () => {
            const toggleFsm = buildToggleFsm({ tag: "off" });

            const cloned = toggleFsm.clone();
            toggleFsm.dispatch({ tag: "switch_on" });

            expect(toggleFsm.getState()).toEqual({ tag: "on" });
            expect(cloned.getState()).toEqual({ tag: "off" });
        });

        it("copies the current state from the cloned fsm.", () => {
            const toggleFsm = buildToggleFsm({ tag: "off" });

            toggleFsm.dispatch({ tag: "switch_on" });
            const cloned = toggleFsm.clone();

            expect(toggleFsm.getState()).toEqual({ tag: "on" });
            expect(cloned.getState()).toEqual({ tag: "on" });
        });
    });

    describe("on/offStateChange()", () => {
        it("callbacks when the state changes", () => {
            const toggleFsm = buildToggleFsm({ tag: "off" });

            const handleStateChange = jest.fn();
            toggleFsm.onStateChange(handleStateChange);
            toggleFsm.dispatch({ tag: "switch_on" });

            expect(handleStateChange).toHaveBeenCalled();
            const calledParams = handleStateChange.mock.calls[0];
            expect(calledParams).toEqual([{ tag: "off" }, { tag: "on" }]);
        });

        it("doesn't callback when unlistened", () => {
            const toggleFsm = buildToggleFsm({ tag: "off" });

            const handleStateChange = jest.fn();
            toggleFsm.onStateChange(handleStateChange);
            toggleFsm.offStateChange(handleStateChange);

            toggleFsm.dispatch({ tag: "switch_on" });

            expect(handleStateChange).not.toHaveBeenCalled();
        });

        it("returns a function to unlisten to state changes", () => {
            const toggleFsm = buildToggleFsm({ tag: "off" });

            const handleStateChange = jest.fn();
            const unlisten = toggleFsm.onStateChange(handleStateChange);
            unlisten();

            toggleFsm.dispatch({ tag: "switch_on" });

            expect(handleStateChange).not.toHaveBeenCalled();
        });
    });

    describe("on/offTransition()", () => {
        it("callbacks when the transition is dispatched", () => {
            const toggleFsm = buildToggleFsm({ tag: "off" });
            const handleSwitchOnWhenOff = jest.fn();
            toggleFsm.onTransition("off", "switch_on", handleSwitchOnWhenOff);
            toggleFsm.dispatch({ tag: "switch_on" });

            expect(handleSwitchOnWhenOff).toHaveBeenCalled();
            const calledParams = handleSwitchOnWhenOff.mock.calls[0];
            expect(calledParams).toEqual([
                { tag: "off" },
                { tag: "switch_on" },
                { tag: "on" },
            ]);
        });

        it("doesn't callback when the listener has been unbound", () => {
            const toggleFsm = buildToggleFsm({ tag: "off" });
            const handleSwitchOnWhenOff = jest.fn();
            toggleFsm.onTransition("off", "switch_on", handleSwitchOnWhenOff);
            toggleFsm.offTransition("off", "switch_on", handleSwitchOnWhenOff);
            toggleFsm.dispatch({ tag: "switch_on" });

            expect(handleSwitchOnWhenOff).not.toHaveBeenCalled();
        });

        it("returns a function to unlisten to transitions", () => {
            const toggleFsm = buildToggleFsm({ tag: "off" });
            const handleSwitchOnWhenOff = jest.fn();
            const unlisten = toggleFsm.onTransition(
                "off",
                "switch_on",
                handleSwitchOnWhenOff,
            );
            unlisten();
            toggleFsm.dispatch({ tag: "switch_on" });

            expect(handleSwitchOnWhenOff).not.toHaveBeenCalled();
        });
    });
});
