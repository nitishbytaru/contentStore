import { configureStore } from '@reduxjs/toolkit';
import ideasReducer from './slices/ideasSlice';
import promptsReducer from './slices/promptsSlice';

export const store = configureStore({
  reducer: {
    ideas: ideasReducer,
    prompts: promptsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
