import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IdeaTypeFilter, IdeaStatusFilter } from '@/types';

export interface IdeasUIState {
  searchQuery: string;
  typeFilter: IdeaTypeFilter;
  statusFilter: IdeaStatusFilter;
}

const initialState: IdeasUIState = {
  searchQuery: '',
  typeFilter: 'all',
  statusFilter: 'pending',
};

const ideasSlice = createSlice({
  name: 'ideas',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setTypeFilter: (state, action: PayloadAction<IdeaTypeFilter>) => {
      state.typeFilter = action.payload;
    },
    setStatusFilter: (state, action: PayloadAction<IdeaStatusFilter>) => {
      state.statusFilter = action.payload;
    },
  },
});

export const { setSearchQuery, setTypeFilter, setStatusFilter } = ideasSlice.actions;
export default ideasSlice.reducer;
