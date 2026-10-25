import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IdeaTypeFilter, IdeaStatusFilter } from '@/types';

export interface IdeasUIState {
  searchQuery: string;
  typeFilter: IdeaTypeFilter;
  statusFilter: IdeaStatusFilter;
  activeTab: string;
}

const initialState: IdeasUIState = {
  searchQuery: '',
  typeFilter: 'all',
  statusFilter: 'pending',
  activeTab: 'pending',
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
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
  },
});

export const { setSearchQuery, setTypeFilter, setStatusFilter, setActiveTab } = ideasSlice.actions;
export default ideasSlice.reducer;
