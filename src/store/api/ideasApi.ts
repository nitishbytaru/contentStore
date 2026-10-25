import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Idea } from '@/types';

/**
 * RTK Query API service for managing Idea resources.
 * Uses canonical `ideaId` naming for unambiguous entity identification.
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
              ...result.map(({ ideaId }) => ({ type: 'Idea' as const, id: ideaId })),
              { type: 'Idea', id: 'LIST' },
            ]
          : [{ type: 'Idea', id: 'LIST' }],
    }),

    getIdeaById: builder.query<Idea, string>({
      query: (ideaId) => `/ideas?ideaId=${encodeURIComponent(ideaId)}`,
      transformResponse: (response: { data: Idea }) => response.data,
      providesTags: (result, error, ideaId) => [{ type: 'Idea', id: ideaId }],
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

    updateIdea: builder.mutation<Idea, Partial<Idea> & { ideaId: string }>({
      query: (idea) => ({
        url: '/ideas',
        method: 'PUT',
        body: idea,
      }),
      transformResponse: (response: { data: Idea }) => response.data,
      invalidatesTags: (result, error, { ideaId }) => [
        { type: 'Idea', id: ideaId },
        { type: 'Idea', id: 'LIST' },
      ],
    }),

    deleteIdea: builder.mutation<{ message: string }, string>({
      query: (ideaId) => ({
        url: `/ideas?ideaId=${encodeURIComponent(ideaId)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, ideaId) => [
        { type: 'Idea', id: ideaId },
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
