import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export interface PromptItem {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface PromptsState {
  items: PromptItem[];
  loading: boolean;
  error: string | null;
  actionLoading: boolean;
  hasFetched: boolean;
}

const initialState: PromptsState = {
  items: [],
  loading: false,
  error: null,
  actionLoading: false,
  hasFetched: false,
};

export const fetchPrompts = createAsyncThunk('prompts/fetchPrompts', async (_, { rejectWithValue }) => {
  try {
    const res = await fetch('/api/prompts');
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch prompts');
    return json.data as PromptItem[];
  } catch (err: any) {
    return rejectWithValue(err.message);
  }
});

export const addPrompt = createAsyncThunk('prompts/addPrompt', async (prompt: { title: string, content: string, category: string }, { rejectWithValue }) => {
  try {
    const res = await fetch('/api/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prompt),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to add prompt');
    return json.data as PromptItem;
  } catch (err: any) {
    return rejectWithValue(err.message);
  }
});

export const updatePrompt = createAsyncThunk('prompts/updatePrompt', async (prompt: Partial<PromptItem> & { id: string }, { rejectWithValue }) => {
  try {
    const res = await fetch('/api/prompts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prompt),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update prompt');
    return json.data as PromptItem;
  } catch (err: any) {
    return rejectWithValue(err.message);
  }
});

export const deletePrompt = createAsyncThunk('prompts/deletePrompt', async (id: string, { rejectWithValue }) => {
  try {
    const res = await fetch(`/api/prompts?id=${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete prompt');
    return id;
  } catch (err: any) {
    return rejectWithValue(err.message);
  }
});

const promptsSlice = createSlice({
  name: 'prompts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Fetch
    builder.addCase(fetchPrompts.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPrompts.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload;
      state.hasFetched = true;
    });
    builder.addCase(fetchPrompts.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Add
    builder.addCase(addPrompt.pending, (state) => {
      state.actionLoading = true;
    });
    builder.addCase(addPrompt.fulfilled, (state, action) => {
      state.actionLoading = false;
      state.items.push(action.payload);
    });
    builder.addCase(addPrompt.rejected, (state, action) => {
      state.actionLoading = false;
      state.error = action.payload as string;
    });

    // Update
    builder.addCase(updatePrompt.pending, (state) => {
      state.actionLoading = true;
    });
    builder.addCase(updatePrompt.fulfilled, (state, action) => {
      state.actionLoading = false;
      const index = state.items.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    });
    builder.addCase(updatePrompt.rejected, (state, action) => {
      state.actionLoading = false;
      state.error = action.payload as string;
    });

    // Delete
    builder.addCase(deletePrompt.pending, (state) => {
      state.actionLoading = true;
    });
    builder.addCase(deletePrompt.fulfilled, (state, action) => {
      state.actionLoading = false;
      state.items = state.items.filter((item) => item.id !== action.payload);
    });
    builder.addCase(deletePrompt.rejected, (state, action) => {
      state.actionLoading = false;
      state.error = action.payload as string;
    });
  },
});

export default promptsSlice.reducer;
