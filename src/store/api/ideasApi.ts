import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Idea } from '@/types';

export interface ResearchMessage {
  id: string;
  ideaId: string;
  role: 'user' | 'assistant' | 'source';
  content: string;
  createdAt: string;
}

/**
 * RTK Query API service for managing Idea resources.
 * Uses canonical `ideaId` naming for unambiguous entity identification.
 */
export const ideasApi = createApi({
  reducerPath: 'ideasApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Idea', 'Research'],
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

    findSimilarIdeas: builder.mutation<
      { ideas: { ideaId: string; title: string }[]; firstIdea: boolean },
      string
    >({
      query: (text) => ({
        url: '/ideas/similar',
        method: 'POST',
        body: { text },
      }),
      transformResponse: (response: {
        data?: { ideaId: string; title: string }[];
        firstIdea?: boolean;
      }) => ({
        ideas: response.data || [],
        firstIdea: Boolean(response.firstIdea),
      }),
    }),

    getResearchMessages: builder.query<ResearchMessage[], string>({
      query: (ideaId) => `/ideas/${encodeURIComponent(ideaId)}/research`,
      transformResponse: (response: { data: ResearchMessage[] }) => response.data || [],
      providesTags: (result, error, ideaId) => [{ type: 'Research', id: ideaId }],
    }),

    sendResearch: builder.mutation<
      ResearchMessage[],
      { ideaId: string; content: string; mode: 'ask' | 'source'; title?: string }
    >({
      query: ({ ideaId, content, mode, title }) => ({
        url: `/ideas/${encodeURIComponent(ideaId)}/research`,
        method: 'POST',
        body: { content, mode, title },
      }),
      transformResponse: (response: { data: ResearchMessage[] }) => response.data || [],
      invalidatesTags: (result, error, { ideaId }) => [
        { type: 'Research', id: ideaId },
        { type: 'Idea', id: ideaId },
      ],
    }),

    generateArticle: builder.mutation<{ mediumArticle: string }, string>({
      query: (ideaId) => ({
        url: `/ideas/${encodeURIComponent(ideaId)}/article`,
        method: 'POST',
      }),
      transformResponse: (response: { data: { mediumArticle: string } }) => response.data,
      invalidatesTags: (result, error, ideaId) => [{ type: 'Idea', id: ideaId }],
    }),

    uploadResearchPdf: builder.mutation<ResearchMessage[], { ideaId: string; file: File; title?: string }>({
      query: ({ ideaId, file, title }) => {
        const body = new FormData();
        body.append('file', file);
        if (title) body.append('title', title);
        return {
          url: `/ideas/${encodeURIComponent(ideaId)}/research/pdf`,
          method: 'POST',
          body,
        };
      },
      transformResponse: (response: { data: ResearchMessage[] }) => response.data || [],
      invalidatesTags: (result, error, { ideaId }) => [
        { type: 'Research', id: ideaId },
        { type: 'Idea', id: ideaId },
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
  useFindSimilarIdeasMutation,
  useGetResearchMessagesQuery,
  useSendResearchMutation,
  useGenerateArticleMutation,
  useUploadResearchPdfMutation,
  useDeleteIdeaMutation,
} = ideasApi;
