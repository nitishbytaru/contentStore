import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Idea {
  id: string;
  idea: string;
  status: 'pending' | 'posted';
  datePosted: string;
  createdAt: string;
  publishedMedium: boolean;
  publishedSubstack: boolean;
  publishedX: boolean;
  publishedYoutube: boolean;
  publishedInstagram: boolean;
  baseArticle: string;
  mediumArticle: string;
  youtubeScript: string;
}

interface IdeasState {
  items: Idea[];
  loading: boolean;
  error: string | null;
  actionLoading: boolean; // For create/update/delete specific actions
  hasFetched: boolean;
}

const initialState: IdeasState = {
  items: [],
  loading: false,
  error: null,
  actionLoading: false,
  hasFetched: false,
};

export const fetchIdeas = createAsyncThunk('ideas/fetchIdeas', async (_, { rejectWithValue }) => {
  try {
    const res = await fetch('/api/ideas');
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch ideas');
    return json.data as Idea[];
  } catch (err: any) {
    return rejectWithValue(err.message);
  }
});

export const addIdea = createAsyncThunk('ideas/addIdea', async (ideaText: string, { rejectWithValue }) => {
  try {
    const res = await fetch('/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea: ideaText }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to add idea');
    return json.data as Idea;
  } catch (err: any) {
    return rejectWithValue(err.message);
  }
});

export const updateIdea = createAsyncThunk('ideas/updateIdea', async (idea: Partial<Idea> & { id: string }, { rejectWithValue }) => {
  try {
    const res = await fetch('/api/ideas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(idea),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update idea');
    return json.data as Idea;
  } catch (err: any) {
    return rejectWithValue(err.message);
  }
});

export const deleteIdea = createAsyncThunk('ideas/deleteIdea', async (id: string, { rejectWithValue }) => {
  try {
    const res = await fetch(`/api/ideas?id=${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete idea');
    return id;
  } catch (err: any) {
    return rejectWithValue(err.message);
  }
});

const ideasSlice = createSlice({
  name: 'ideas',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Fetch ideas
    builder.addCase(fetchIdeas.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchIdeas.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload;
      state.hasFetched = true;
    });
    builder.addCase(fetchIdeas.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Add idea
    builder.addCase(addIdea.pending, (state) => {
      state.actionLoading = true;
    });
    builder.addCase(addIdea.fulfilled, (state, action) => {
      state.actionLoading = false;
      state.items.push(action.payload);
    });
    builder.addCase(addIdea.rejected, (state, action) => {
      state.actionLoading = false;
      state.error = action.payload as string;
    });

    // Update idea
    builder.addCase(updateIdea.pending, (state) => {
      state.actionLoading = true;
    });
    builder.addCase(updateIdea.fulfilled, (state, action) => {
      state.actionLoading = false;
      const index = state.items.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    });
    builder.addCase(updateIdea.rejected, (state, action) => {
      state.actionLoading = false;
      state.error = action.payload as string;
    });

    // Delete idea
    builder.addCase(deleteIdea.pending, (state) => {
      state.actionLoading = true;
    });
    builder.addCase(deleteIdea.fulfilled, (state, action) => {
      state.actionLoading = false;
      state.items = state.items.filter((item) => item.id !== action.payload);
    });
    builder.addCase(deleteIdea.rejected, (state, action) => {
      state.actionLoading = false;
      state.error = action.payload as string;
    });
  },
});

export default ideasSlice.reducer;
