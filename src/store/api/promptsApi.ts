import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { PromptItem } from '@/types';

/**
 * RTK Query API service for managing Prompt templates.
 * Handles fetching, creating, updating, and deleting prompts.
 */
export const promptsApi = createApi({
  reducerPath: 'promptsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Prompt'],
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

    addPrompt: builder.mutation<PromptItem, { title: string; content: string }>({
      query: (prompt) => ({
        url: '/prompts',
        method: 'POST',
        body: prompt,
      }),
      transformResponse: (response: { data: PromptItem }) => response.data,
      invalidatesTags: [{ type: 'Prompt', id: 'LIST' }],
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

    enhancePrompt: builder.mutation<PromptItem, { id: string }>({
      query: ({ id }) => ({
        url: '/prompts/enhance',
        method: 'POST',
        body: { id },
      }),
      transformResponse: (response: { data: PromptItem }) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: 'Prompt', id },
        { type: 'Prompt', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetPromptsQuery,
  useAddPromptMutation,
  useUpdatePromptMutation,
  useDeletePromptMutation,
  useEnhancePromptMutation,
} = promptsApi;
