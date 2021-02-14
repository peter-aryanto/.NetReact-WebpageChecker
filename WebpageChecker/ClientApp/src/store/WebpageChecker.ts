import { Action, Reducer } from 'redux';
import { AppThunkAction } from './';

// -----------------
// STATE - This defines the type of data maintained in the Redux store.

export interface WebpageCheckerState {
    isLoading: boolean;
    startDateIndex?: number;
    forecasts: WebpageChecker[];
}

export interface WebpageChecker {
    date: string;
    temperatureC: number;
    temperatureF: number;
    summary: string;
}

// -----------------
// ACTIONS - These are serializable (hence replayable) descriptions of state transitions.
// They do not themselves have any side-effects; they just describe something that is going to happen.

interface RequestWebpageCheckerAction {
    type: 'REQUEST_WEBPAGE_CHECKER';
    startDateIndex: number;
}

interface ReceiveWebpageCheckerAction {
    type: 'RECEIVE_WEBPAGE_CHECKER';
    startDateIndex: number;
    forecasts: WebpageChecker[];
}

// Declare a 'discriminated union' type. This guarantees that all references to 'type' properties contain one of the
// declared type strings (and not any other arbitrary string).
type KnownAction = RequestWebpageCheckerAction | ReceiveWebpageCheckerAction;

// ----------------
// ACTION CREATORS - These are functions exposed to UI components that will trigger a state transition.
// They don't directly mutate state, but they can have external side-effects (such as loading data).

export const actionCreators = {
    requestWebpageChecker: (startDateIndex: number): AppThunkAction<KnownAction> => (dispatch, getState) => {
        // Only load data if it's something we don't already have (and are not already loading)
        const appState = getState();
        if (appState && appState.webpageChecker && startDateIndex !== appState.webpageChecker.startDateIndex) {
            fetch(`webpagechecker`)
                .then(response => response.json() as Promise<WebpageChecker[]>)
                .then(data => {
                    dispatch({ type: 'RECEIVE_WEBPAGE_CHECKER', startDateIndex: startDateIndex, forecasts: data });
                });

            dispatch({ type: 'REQUEST_WEBPAGE_CHECKER', startDateIndex: startDateIndex });
        }
    }
};

// ----------------
// REDUCER - For a given state and action, returns the new state. To support time travel, this must not mutate the old state.

const unloadedState: WebpageCheckerState = { forecasts: [], isLoading: false };

export const reducer: Reducer<WebpageCheckerState> = (state: WebpageCheckerState | undefined, incomingAction: Action): WebpageCheckerState => {
    if (state === undefined) {
        return unloadedState;
    }

    const action = incomingAction as KnownAction;
    switch (action.type) {
        case 'REQUEST_WEBPAGE_CHECKER':
            return {
                startDateIndex: action.startDateIndex,
                forecasts: state.forecasts,
                isLoading: true
            };
        case 'RECEIVE_WEBPAGE_CHECKER':
            // Only accept the incoming data if it matches the most recent request. This ensures we correctly
            // handle out-of-order responses.
            if (action.startDateIndex === state.startDateIndex) {
                return {
                    startDateIndex: action.startDateIndex,
                    forecasts: action.forecasts,
                    isLoading: false
                };
            }
            break;
    }

    return state;
};
