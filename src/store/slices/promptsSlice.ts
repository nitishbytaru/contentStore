import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { PromptItem } from '@/types';

interface PromptsState {
  items: PromptItem[];
  categories: string[];
  selectedCategory: string; // 'all' or category name
  loading: boolean;
  categoriesLoading: boolean;
  error: string | null;
  actionLoading: boolean;
  hasFetched: boolean;
}

const initialState: PromptsState = {
  items: [],
  categories: ['General'],
  selectedCategory: 'all',
  loading: false,
  categoriesLoading: false,
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

export const fetchPromptCategories = createAsyncThunk('prompts/fetchPromptCategories', async (_, { rejectWithValue }) => {
  try {
    const res = await fetch('/api/prompts/categories');
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch categories');
    return json.data as string[];
  } catch (err: any) {
    return rejectWithValue(err.message);
  }
});

export const createPromptCategory = createAsyncThunk('prompts/createPromptCategory', async (name: string, { rejectWithValue }) => {
  try {
    const res = await fetch('/api/prompts/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create category');
    return json.data as string;
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
  reducers: {
    setSelectedCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch Prompts
    builder.addCase(fetchPrompts.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPrompts.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload;
      state.hasFetched = true;
      // Merge categories from items into state.categories
      const existingSet = new Set(state.categories.map(c => c.toLowerCase()));
      action.payload.forEach((p) => {
        const cat = (p.category || '').trim();
        if (cat && !existingSet.has(cat.toLowerCase())) {
          state.categories.push(cat);
          existingSet.add(cat.toLowerCase());
        }
      });
    });
    builder.addCase(fetchPrompts.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Categories
    builder.addCase(fetchPromptCategories.pending, (state) => {
      state.categoriesLoading = true;
    });
    builder.addCase(fetchPromptCategories.fulfilled, (state, action) => {
      state.categoriesLoading = false;
      const combinedSet = new Set<string>();
      // Keep action payload
      action.payload.forEach(c => {
        if (c?.trim()) combinedSet.add(c.trim());
      });
      // Also preserve any from existing items
      state.items.forEach(i => {
        if (i.category?.trim()) combinedSet.add(i.category.trim());
      });
      if (!combinedSet.has('General')) combinedSet.add('General');
      state.categories = Array.from(combinedSet);
    });
    builder.addCase(fetchPromptCategories.rejected, (state) => {
      state.categoriesLoading = false;
    });

    // Create Category
    builder.addCase(createPromptCategory.fulfilled, (state, action) => {
      const newCat = action.payload.trim();
      const exists = state.categories.some(c => c.toLowerCase() === newCat.toLowerCase());
      if (!exists && newCat) {
        state.categories.push(newCat);
      }
      state.selectedCategory = newCat;
    });

    // Add Prompt
    builder.addCase(addPrompt.pending, (state) => {
      state.actionLoading = true;
    });
    builder.addCase(addPrompt.fulfilled, (state, action) => {
      state.actionLoading = false;
      state.items.push(action.payload);
      const cat = (action.payload.category || '').trim();
      if (cat && !state.categories.some(c => c.toLowerCase() === cat.toLowerCase())) {
        state.categories.push(cat);
      }
    });
    builder.addCase(addPrompt.rejected, (state, action) => {
      state.actionLoading = false;
      state.error = action.payload as string;
    });

    // Update Prompt
    builder.addCase(updatePrompt.pending, (state) => {
      state.actionLoading = true;
    });
    builder.addCase(updatePrompt.fulfilled, (state, action) => {
      state.actionLoading = false;
      const index = state.items.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
      const cat = (action.payload.category || '').trim();
      if (cat && !state.categories.some(c => c.toLowerCase() === cat.toLowerCase())) {
        state.categories.push(cat);
      }
    });
    builder.addCase(updatePrompt.rejected, (state, action) => {
      state.actionLoading = false;
      state.error = action.payload as string;
    });

    // Delete Prompt
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

export const { setSelectedCategory } = promptsSlice.actions;
export default promptsSlice.reducer;
