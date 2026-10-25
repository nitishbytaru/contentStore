import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PromptsUIState {
  selectedCategory: string; // 'all' or category name
}

const initialState: PromptsUIState = {
  selectedCategory: 'all',
};

const promptsSlice = createSlice({
  name: 'prompts',
  initialState,
  reducers: {
    setSelectedCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload;
    },
  },
});

export const { setSelectedCategory } = promptsSlice.actions;
export default promptsSlice.reducer;
