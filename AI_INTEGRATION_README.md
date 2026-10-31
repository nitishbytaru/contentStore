# ContentStore & GenAI Architecture Integration Blueprint 🚀

This document details the architectural plan, feature mapping, and integration roadmap for incorporating the generative AI agents, pipelines, and asynchronous queues from the **GenAI Playground** into **ContentStore**.

---

## 📑 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Ecosystem Mapping: ContentStore ↔ GenAI Modules](#ecosystem-mapping-contentstore--genai-modules)
3. [Deep-Dive Feature Integrations](#deep-dive-feature-integrations)
   - [1. PDF RAG Document Ingestion (`rag/`)](#1-pdf-rag-document-ingestion-rag)
   - [2. LangGraph Cyclical Editorial Engine (`learning_langgraph/`)](#2-langgraph-cyclical-editorial-engine-learning_langgraph)
   - [3. Asynchronous Task Queue Architecture (`rag_queue/`)](#3-asynchronous-task-queue-architecture-rag_queue)
   - [4. Stateful Memory & Cross-Idea Graph (`mem_agent/`)](#4-stateful-memory--cross-idea-graph-mem_agent)
   - [5. Voice Teleprompter & Audio Intake (`voice_agent/`)](#5-voice-teleprompter--audio-intake-voice_agent)
   - [6. Grounded Production Tool Calling (`weather-agent/`)](#6-grounded-production-tool-calling-weather-agent)
4. [High-Level System Architecture](#high-level-system-architecture)
5. [Implementation Phases & Roadmap](#implementation-phases--roadmap)
6. [Tech Stack & Infrastructure Requirements](#tech-stack--infrastructure-requirements)

---

## 🌟 Executive Summary

**ContentStore** is a content-creation operating system built on Next.js 16, React 19, TypeScript, and Google Sheets. It tracks content ideas across lifecycle stages (Research, Drafting, Video Production, Uploaded) and features built-in tools like an in-browser Teleprompter (`ScriptPrompter.tsx`), a Prompt Manager (`/prompts`), and Analytics.

The **GenAI Monorepo** brings six production-grade AI capabilities:
1. **Document RAG** (LangChain, Qdrant vector search, Gemini context grounding)
2. **LangGraph Agent State Machines** (Cyclical feedback loops, multi-agent evaluation)
3. **Asynchronous Queues** (FastAPI, Valkey/Redis, Python RQ for long inferences)
4. **Stateful Graph Memory** (Mem0, Neo4j, Qdrant)
5. **Real-time Voice & Audio Loops** (Speech-to-Text, Gemini Native Audio TTS)
6. **Function / Tool Calling** (Pydantic schema validation, grounded external execution)

Integrating these modules transforms ContentStore from a **manual tracking dashboard** into an **autonomous AI-powered Content Engine**.

---

## 🗺️ Ecosystem Mapping: ContentStore ↔ GenAI Modules

| GenAI Project | ContentStore Touchpoint | Integration Impact | Priority |
| :--- | :--- | :--- | :--- |
| **PDF RAG (`rag/`)** | `IdeaResearchStep.tsx` & Research Drawer in Idea Editor | Upload source PDFs/papers, cite statistics, and extract quotes directly into drafts. | **P0 (Critical)** |
| **LangGraph (`learning_langgraph/`)** | Drafting Stage (`IdeaContentTabs.tsx`) | Multi-node drafting pipeline: Research -> Outline -> Script/Article -> Quality Critique -> Polish. | **P0 (Critical)** |
| **Async Queue (`rag_queue/`)** | Next.js API Routes (`/api/ideas`, `/api/content`) | Prevent Vercel/Next.js timeouts by processing long-form script generation via Valkey + RQ workers. | **P0 (Critical)** |
| **Memory Agent (`mem_agent/`)** | Creator Settings & Idea Ideation (`TweetPlanner.tsx`) | Learn creator tone, track past published topics via Neo4j, and suggest cross-references. | **P1 (High)** |
| **Voice Agent (`voice_agent/`)** | `ScriptPrompter.tsx` & Mobile Audio Memo Intake | Voice-tracked teleprompter scrolling, rehearsal feedback coach (WPM, filler words), and voice capture. | **P1 (High)** |
| **Tool Calling (`weather-agent/`)** | Content Research & Idea Validation | Web search grounding, SEO/topic trends verification, and video duration estimation. | **P2 (Medium)** |

---

## 🔍 Deep-Dive Feature Integrations

### 1. PDF RAG Document Ingestion (`rag/`)
- **Current Touchpoint**: `src/components/idea-detail/IdeaResearchStep.tsx`
- **Current Behavior**: Users manually paste raw notes, bullet points, or links into a `<Textarea>`.
- **Integrated Capability**:
  - **Document Ingestion**: Drag-and-drop reference PDFs, research reports, book extracts, or interview transcripts.
  - **Vector Chunking & Storage**: Chunks are embedded with `models/gemini-embedding-001` and indexed in **Qdrant** with payload filtering (`ideaId: string`).
  - **Grounded Q&A Panel**: An AI assistant side-drawer grounded strictly in the uploaded research to pull verified facts, data points, and direct quotes directly into the draft editor with page-number citations.

### 2. LangGraph Cyclical Editorial Engine (`learning_langgraph/`)
- **Current Touchpoint**: `src/components/idea-detail/IdeaContentTabs.tsx`
- **Current Behavior**: Content fields (`baseArticle`, `mediumArticle`, `youtubeScript`) are edited manually or drafted from one-off prompts.
- **Integrated Capability**:
  - Implement a cyclical state graph for content generation:
    ```text
    [Raw Research] 
          │
          ▼
    [1. Synthesizer Node]  ──► Extracts core thesis & viral hooks
          │
          ▼
    [2. Outliner Node]     ──► Generates 3-act YouTube structure or H2/H3 article outline
          │
          ▼
    [3. Drafter Node]      ──► Writes draft with prompter cues ([Pause], [B-Roll], [Graphic])
          │
          ▼
    [4. Critic Node]       ──► Evaluates retention risk, tone, readability score
          │
      ┌───┴───────────────┐
    Score < 8           Score >= 8
      │                   │
      ▼                   ▼
    [Refine Loop]    [5. Platform Adapter Node]
                          ├──► Medium Article (Long-form narrative)
                          ├──► Substack Newsletter (Conversational tone)
                          └──► YouTube Script (Optimized for ScriptPrompter)
    ```

### 3. Asynchronous Task Queue Architecture (`rag_queue/`)
- **Current Touchpoint**: Next.js Backend & API Routes (`src/app/api/...`)
- **Current Problem**: Generating a 2,000-word script or running a multi-node LangGraph agent takes 30–60+ seconds, violating Next.js/Vercel serverless HTTP timeout constraints (10s–30s).
- **Integrated Capability**:
  - Adopt the **FastAPI + Valkey/Redis + Python RQ** pattern:
    1. Next.js triggers generation via `POST /api/ai/jobs/script-generate` with `ideaId`.
    2. FastAPI queues the job and returns `{ jobId, status: "queued" }` within 100ms.
    3. Dedicated Python RQ background worker runs the heavy LangGraph/RAG pipeline.
    4. Next.js polls `GET /api/ai/jobs/:jobId` (or subscribes via Server-Sent Events).
    5. ContentStore displays a live progress skeleton and auto-populates the editor when completed.

### 4. Stateful Memory & Cross-Idea Graph (`mem_agent/`)
- **Current Touchpoint**: Idea ideation and creator consistency across sessions.
- **Integrated Capability**:
  - **Creator Tone Memory (Mem0 + Qdrant)**: Stores stylistic preferences (e.g., *"Always write with concise sentences"*, *"Use software engineering analogies"*, *"Avoid generic marketing buzzwords"*).
  - **Knowledge Graph (Neo4j)**: Maps concepts across historical content.
    - Tracks entities: `(Idea)-[:COVERS]->(Topic)`, `(Idea)-[:REFERENCES]->(Tool)`.
    - Enables automatic suggestions: *"You covered Docker containers in Idea #14; would you like to link this new Kubernetes video back to that project?"*

### 5. Voice Teleprompter & Audio Intake (`voice_agent/`)
- **Current Touchpoint**: `src/components/ScriptPrompter.tsx` & Idea Creation
- **Integrated Capability**:
  - **Voice-Synced Teleprompter**: While recording, browser mic captures speech via Web Speech API or local audio stream, advancing the teleprompter based on spoken words rather than a fixed timer.
  - **Rehearsal Coach**: In rehearsal mode, the agent listens to the creator, measures Words-Per-Minute (WPM), flags filler words (*um, uh, like*), and highlights hard-to-pronounce sentences.
  - **Audio-to-Idea Mobile Intake**: Quick-record voice notes on mobile. Transcribed via Google STT, summarized by Gemini into title, format, and initial bullet points, and appended to the Google Sheet.

### 6. Grounded Production Tool Calling (`weather-agent/`)
- **Current Touchpoint**: Research validation and metadata tools.
- **Integrated Capability**:
  - Adapts the strict Pydantic function-calling pattern:
    - `verify_code_snippet(code, language)`: Runs unit tests or lint checks against code snippets included in technical tutorials.
    - `fetch_latest_docs(library_name)`: Queries official docs to ensure API versions mentioned in the article are current.
    - `calculate_speech_duration(script_text, wpm)`: Accurately predicts video length based on word count and cue pauses.

---

## 🏗️ High-Level System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS 16 FRONTEND                             │
│                                                                        │
│  ┌───────────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │ Idea Pipeline / Board │  │ ScriptPrompter  │  │  Prompt Library  │  │
│  │ (React 19 / Redux)    │  │ (Teleprompter)  │  │  (/prompts)      │  │
│  └───────────┬───────────┘  └────────┬────────┘  └──────────────────┘  │
└──────────────┼───────────────────────┼─────────────────────────────────┘
               │ HTTP / JSON           │ Audio Stream / WebSockets
               ▼                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FASTAPI AI BACKEND SERVICE                      │
│                                                                        │
│   ├── /rag/upload & /rag/query       ──► LangChain + Qdrant Vector DB  │
│   ├── /agent/draft-pipeline          ──► LangGraph Multi-Node Engine   │
│   ├── /memory/persona & /memory/graph──► Mem0 + Neo4j Graph DB         │
│   └── /voice/rehearsal-feedback      ──► Google STT + Gemini Audio     │
└──────────────────────────────────────┬─────────────────────────────────┘
                                       │ Enqueues Jobs
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      BACKGROUND TASK QUEUE                             │
│                                                                        │
│   ┌───────────────────────────┐     ┌──────────────────────────────┐   │
│   │   Valkey / Redis Broker   │ ──► │ Python RQ Distributed Worker │   │
│   └───────────────────────────┘     └──────────────┬───────────────┘   │
└────────────────────────────────────────────────────┼───────────────────┘
                                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL STORAGE & APIS                        │
│                                                                        │
│   ├── Google Gemini API (Gemini 2.5 Flash / Pro / Audio)               │
│   ├── Google Sheets DB (Existing ContentStore Data Layer)              │
│   └── Qdrant Vector Store (Local Docker Container)                     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📅 Implementation Phases & Roadmap

### Phase 1: High-Impact Research & Document Grounding (Quick Win)
- [ ] Spin up local **Qdrant** container via Docker Compose.
- [ ] Create a FastAPI microservice endpoint:
  - `POST /api/research/upload-pdf` (parse, chunk, embed, index by `ideaId`).
  - `POST /api/research/chat` (retrieval-grounded Q&A).
- [ ] Add a "Source Documents" upload and AI research chat drawer inside `IdeaResearchStep.tsx`.

### Phase 2: Asynchronous Multi-Agent Drafting Pipeline
- [ ] Set up **Valkey** and **Python RQ** worker to handle long-running generation.
- [ ] Build the **LangGraph** drafting workflow (Synthesizer -> Outliner -> Drafter -> Quality Critic).
- [ ] Connect `IdeaContentTabs.tsx` with a "Generate Script with AI" trigger, polling status with animated UI skeleton.

### Phase 3: Teleprompter Voice Enhancements & Persona Memory
- [ ] Integrate mic recording and voice-guided scroll tracking into `ScriptPrompter.tsx`.
- [ ] Deploy **Mem0** with creator preference storage (tone, target audience, format conventions).
- [ ] (Optional) Connect **Neo4j** to build an interconnected content topic graph across historical ideas.

---

## 💻 Tech Stack & Infrastructure Requirements

- **Frontend & App Layer**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Shadcn UI.
- **AI Backend**: Python 3.11+, FastAPI, Uvicorn, Pydantic v2.
- **AI & Orchestration**: Google GenAI SDK (`google-genai`), LangChain, LangGraph, Mem0.
- **Queue & Database Infrastructure**:
  - **Queue / Broker**: Valkey (or Redis) + Python RQ.
  - **Vector DB**: Qdrant (Dockerized).
  - **Graph DB (Optional)**: Neo4j (Dockerized).
  - **Existing Database**: Google Sheets API (`google-spreadsheet`).
