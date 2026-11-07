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
}

const initialState: TourState = {
  active: false,
  stepIndex: 0,
  sampleIdeaId: null,
  hydrated: false,
};

const lastIndex = TOUR_STEPS.length - 1;

const tourSlice = createSlice({
  name: 'tour',
  initialState,
  reducers: {
    hydrateTour: (state, action: PayloadAction<Partial<Omit<TourState, 'hydrated'>> | null>) => {
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
    },
    nextStep: (state) => {
      if (state.stepIndex < lastIndex) state.stepIndex += 1;
    },
    prevStep: (state) => {
      if (state.stepIndex > 0) state.stepIndex -= 1;
    },
    endTour: (state) => {
      state.active = false;
      state.stepIndex = 0;
    },
    /** Sent by components after an action succeeds. Ignored unless the current step waits for it. */
    tourSignal: (state, action: PayloadAction<TourSignal>) => {
      if (!state.active) return;
      const step = TOUR_STEPS[state.stepIndex];
      if (step && typeof step.advance === 'object' && step.advance.signal === action.payload && state.stepIndex < lastIndex) {
        state.stepIndex += 1;
      }
    },
  },
});

export const { hydrateTour, startTour, nextStep, prevStep, endTour, tourSignal } = tourSlice.actions;
export default tourSlice.reducer;
