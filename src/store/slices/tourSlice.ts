import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TOUR_STEPS, TourSignal } from '@/lib/onboarding/tour-steps';

/**
 * Onboarding product tour state. `hydrated` is false until TourOverlay has
 * restored any saved progress from localStorage.
 */
export interface TourState {
  active: boolean;
  stepIndex: number;
  sampleIdeaId: string | null;
  hydrated: boolean;
  /** True while the action the current step waits for is running (shows the card loader). */
  busy: boolean;
}

const initialState: TourState = {
  active: false,
  stepIndex: 0,
  sampleIdeaId: null,
  hydrated: false,
  busy: false,
};

const lastIndex = TOUR_STEPS.length - 1;

const tourSlice = createSlice({
  name: 'tour',
  initialState,
  reducers: {
    hydrateTour: (state, action: PayloadAction<Partial<Omit<TourState, 'hydrated' | 'busy'>> | null>) => {
      if (action.payload?.active && action.payload.sampleIdeaId) {
        state.active = true;
        state.sampleIdeaId = action.payload.sampleIdeaId;
        state.stepIndex = Math.min(Math.max(0, action.payload.stepIndex ?? 0), lastIndex);
      }
      state.hydrated = true;
    },
    startTour: (state, action: PayloadAction<{ sampleIdeaId: string }>) => {
      state.active = true;
      state.stepIndex = 0;
      state.sampleIdeaId = action.payload.sampleIdeaId;
      state.busy = false;
    },
    nextStep: (state) => {
      if (state.stepIndex < lastIndex) state.stepIndex += 1;
      state.busy = false;
    },
    prevStep: (state) => {
      if (state.stepIndex > 0) state.stepIndex -= 1;
      state.busy = false;
    },
    /** Jumps to a step, e.g. the first step of the next section when one is skipped. */
    goToStep: (state, action: PayloadAction<number>) => {
      state.stepIndex = Math.min(Math.max(0, action.payload), lastIndex);
      state.busy = false;
    },
    endTour: (state) => {
      state.active = false;
      state.stepIndex = 0;
      state.busy = false;
    },
    /** Sent by components when an action starts (true) and finishes (false). */
    tourBusy: (state, action: PayloadAction<boolean>) => {
      state.busy = state.active && action.payload;
    },
    /** Sent by components after an action succeeds. Ignored unless the current step waits for it. */
    tourSignal: (state, action: PayloadAction<TourSignal>) => {
      if (!state.active) return;
      const step = TOUR_STEPS[state.stepIndex];
      if (step && typeof step.advance === 'object' && step.advance.signal === action.payload && state.stepIndex < lastIndex) {
        state.stepIndex += 1;
        state.busy = false;
      }
    },
  },
});

export const { hydrateTour, startTour, nextStep, prevStep, goToStep, endTour, tourBusy, tourSignal } = tourSlice.actions;
export default tourSlice.reducer;
