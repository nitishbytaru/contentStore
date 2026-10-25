import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { PromptItem } from '@/types';

/**
 * RTK Query API service for managing Prompt templates and categories.
 * Handles fetching, creating, updating, and deleting prompts and prompt categories.
 */
export const promptsApi = createApi({
  reducerPath: 'promptsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Prompt', 'Category'],
  endpoints: (builder) => ({
    getPrompts: builder.query<PromptItem[], void>({
      query: () => '/prompts',
      transformResponse: (response: { data: PromptItem[] }) => response.data || [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Prompt' as const, id })),
              { type: 'Prompt', id: 'LIST' },
            ]
          : [{ type: 'Prompt', id: 'LIST' }],
    }),

    getPromptCategories: builder.query<string[], void>({
      query: () => '/prompts/categories',
      transformResponse: (response: { data: string[] }) => response.data || ['General'],
      providesTags: [{ type: 'Category', id: 'LIST' }],
    }),

    addPrompt: builder.mutation<PromptItem, { title: string; content: string; category: string }>({
      query: (prompt) => ({
        url: '/prompts',
        method: 'POST',
        body: prompt,
      }),
      transformResponse: (response: { data: PromptItem }) => response.data,
      invalidatesTags: [
        { type: 'Prompt', id: 'LIST' },
        { type: 'Category', id: 'LIST' },
      ],
    }),

    updatePrompt: builder.mutation<PromptItem, Partial<PromptItem> & { id: string }>({
      query: (prompt) => ({
        url: '/prompts',
        method: 'PUT',
        body: prompt,
      }),
      transformResponse: (response: { data: PromptItem }) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: 'Prompt', id },
        { type: 'Prompt', id: 'LIST' },
        { type: 'Category', id: 'LIST' },
      ],
    }),

    deletePrompt: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/prompts?id=${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Prompt', id },
        { type: 'Prompt', id: 'LIST' },
      ],
    }),

    createPromptCategory: builder.mutation<string, string>({
      query: (name) => ({
        url: '/prompts/categories',
        method: 'POST',
        body: { name },
      }),
      transformResponse: (response: { data: string }) => response.data,
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetPromptsQuery,
  useGetPromptCategoriesQuery,
  useAddPromptMutation,
  useUpdatePromptMutation,
  useDeletePromptMutation,
  useCreatePromptCategoryMutation,
} = promptsApi;
