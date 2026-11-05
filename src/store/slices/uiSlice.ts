import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * App-wide blocking operations that are not RTK Query mutations
 * (e.g. plain fetch calls). While any are running, the BlockingOverlay
 * shows a loader and the rest of the app is disabled.
 */
export interface UIState {
  blockingTasks: string[];
}

const initialState: UIState = {
  blockingTasks: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    startBlocking: (state, action: PayloadAction<string>) => {
      state.blockingTasks.push(action.payload);
    },
    endBlocking: (state, action: PayloadAction<string>) => {
      const index = state.blockingTasks.indexOf(action.payload);
      if (index !== -1) state.blockingTasks.splice(index, 1);
    },
  },
});

export const { startBlocking, endBlocking } = uiSlice.actions;
export default uiSlice.reducer;
