import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Idea } from '@/types';

/**
 * RTK Query API service for managing Idea resources.
 * Handles fetching, creating, updating, and deleting ideas with automatic cache management.
 */
export const ideasApi = createApi({
  reducerPath: 'ideasApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Idea'],
  endpoints: (builder) => ({
    getIdeas: builder.query<Idea[], void>({
      query: () => '/ideas',
      transformResponse: (response: { data: Idea[] }) => response.data || [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Idea' as const, id })),
              { type: 'Idea', id: 'LIST' },
            ]
          : [{ type: 'Idea', id: 'LIST' }],
    }),

    getIdeaById: builder.query<Idea, string>({
      query: (id) => `/ideas?id=${encodeURIComponent(id)}`,
      transformResponse: (response: { data: Idea }) => response.data,
      providesTags: (result, error, id) => [{ type: 'Idea', id }],
    }),

    addIdea: builder.mutation<Idea, string | { idea: string; description?: string }>({
      query: (payload) => {
        const body = typeof payload === 'string' ? { idea: payload } : payload;
        return {
          url: '/ideas',
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: { data: Idea }) => response.data,
      invalidatesTags: [{ type: 'Idea', id: 'LIST' }],
    }),

    updateIdea: builder.mutation<Idea, Partial<Idea> & { id: string }>({
      query: (idea) => ({
        url: '/ideas',
        method: 'PUT',
        body: idea,
      }),
      transformResponse: (response: { data: Idea }) => response.data,
      invalidatesTags: (result, error, { id }) => [
        { type: 'Idea', id },
        { type: 'Idea', id: 'LIST' },
      ],
    }),

    deleteIdea: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/ideas?id=${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Idea', id },
        { type: 'Idea', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetIdeasQuery,
  useGetIdeaByIdQuery,
  useAddIdeaMutation,
  useUpdateIdeaMutation,
  useDeleteIdeaMutation,
} = ideasApi;
