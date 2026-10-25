import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import ideasReducer from './slices/ideasSlice';
import promptsReducer from './slices/promptsSlice';
import { ideasApi } from './api/ideasApi';
import { promptsApi } from './api/promptsApi';

export const store = configureStore({
  reducer: {
    ideas: ideasReducer,
    prompts: promptsReducer,
    [ideasApi.reducerPath]: ideasApi.reducer,
    [promptsApi.reducerPath]: promptsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(ideasApi.middleware, promptsApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
