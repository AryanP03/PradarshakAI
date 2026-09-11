# PradarshakAI System Architecture

This document describes the end-to-end architecture of the PradarshakAI platform, derived from an analysis of the actual implementation. It covers the major subsystems, data flows, client-server boundaries, and external dependencies.

---

## 1. High-Level System Architecture

This diagram illustrates the macro-level relationships between the Citizen, the Next.js Frontend, the Express.js Backend, internal AI/Voice orchestration, the database, and external API providers.

```mermaid
flowchart TD
    %% Styling Classes
    classDef client fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0f172a;
    classDef frontend fill:#bae6fd,stroke:#0369a1,stroke-width:2px,color:#0f172a;
    classDef backend fill:#1e3a8a,stroke:#172554,stroke-width:2px,color:#ffffff;
    classDef ai fill:#fef08a,stroke:#ca8a04,stroke-width:2px,color:#0f172a;
    classDef db fill:#e2e8f0,stroke:#475569,stroke-width:2px,color:#0f172a;
    classDef external fill:#f87171,stroke:#b91c1c,stroke-width:2px,color:#ffffff;

    User(("Citizen (User)")):::client
    Browser["Web Browser / Mobile View"]:::client

    subgraph "Frontend Layer (Next.js App Router)"
        UI_Home["Home (/home)"]:::frontend
        UI_Chat["Chat UI (/chat)"]:::frontend
        UI_Profile["Profile (/profile)"]:::frontend
        UI_Other["Schemes / Partners / EMI"]:::frontend
    end

    subgraph "Backend Application (Express.js)"
        API_Auth["Auth API"]:::backend
        API_Chat["Chat Orchestration API"]:::backend
        API_Services["Business Logic (Schemes, EMI, Partners)"]:::backend
    end

    subgraph "AI & Voice Orchestration"
        ChatOrchestrator["Agentic Chat Orchestrator"]:::ai
        STTService["STT Service"]:::ai
        TTSService["TTS Service"]:::ai
        ToolExecutor["Function/Tool Executor"]:::ai
    end

    subgraph "Data Layer"
        PG[(PostgreSQL DB)]:::db
    end

    subgraph "External Services"
        OpenRouter["OpenRouter (LLM)"]:::external
        SarvamAI["Sarvam AI (Speech Models)"]:::external
    end

    %% High-level Flow
    User --> Browser
    Browser --> UI_Home & UI_Chat & UI_Profile & UI_Other
    
    UI_Chat -->|"Text / Audio Input"| API_Chat
    UI_Profile -->|"Profile Data"| API_Auth
    UI_Other -->|"Direct Queries"| API_Services
    
    API_Chat --> ChatOrchestrator
    ChatOrchestrator <--> STTService & TTSService
    ChatOrchestrator <--> ToolExecutor
    ChatOrchestrator <--> API_Services
    
    ToolExecutor <--> PG
    API_Services <--> PG
    API_Auth <--> PG
    
    STTService <-->|"Audio to Text"| SarvamAI
    TTSService <-->|"Text to Audio"| SarvamAI
    ChatOrchestrator <-->|"Tool Calling LLM"| OpenRouter
```

---

## 2. Detailed End-to-End Application Flow

This detailed diagram breaks down the specific workflows for Text Chat, Voice Input, Conversation Orchestration, Scheme Recommendation, Shared Chats, and Profile logic.

```mermaid
flowchart TD
    %% Styling Classes
    classDef client fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0f172a;
    classDef nextjs fill:#bae6fd,stroke:#0369a1,stroke-width:2px,color:#0f172a;
    classDef express fill:#1e3a8a,stroke:#172554,stroke-width:2px,color:#ffffff;
    classDef logic fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#ffffff;
    classDef ai fill:#fef08a,stroke:#ca8a04,stroke-width:2px,color:#0f172a;
    classDef db fill:#e2e8f0,stroke:#475569,stroke-width:2px,color:#0f172a;
    classDef external fill:#f87171,stroke:#b91c1c,stroke-width:2px,color:#ffffff;

    %% Client Interactions
    User(("User")):::client
    TextIn["Types Message"]:::client
    MicIn["Composer Mic (Dictation)"]:::client
    VoiceIn["Talk to PradarshakAI (Voice-to-Voice)"]:::client
    NavProfile["Views Profile"]:::client
    ShareAction["Clicks Share Chat"]:::client

    User --> TextIn & MicIn & VoiceIn & NavProfile & ShareAction

    %% Frontend App (Next.js)
    subgraph "Frontend (Next.js UI)"
        ChatUI["Chat Composer & Message List"]:::nextjs
        VoiceUI["Voice Visualizer & Recording"]:::nextjs
        ProfileUI["Profile Page"]:::nextjs
        ShareModal["Share Chat Modal"]:::nextjs
    end

    TextIn --> ChatUI
    MicIn --> VoiceUI
    VoiceIn --> VoiceUI
    NavProfile --> ProfileUI
    ShareAction --> ShareModal

    VoiceUI -->|"Audio Blob"| API_STT["POST /api/stt"]:::express
    ChatUI -->|"Text Message"| API_Chat["POST /api/chat"]:::express
    ProfileUI -->|"JWT Token"| API_Profile["GET /api/user/profile"]:::express
    ShareModal -->|"Chat ID"| API_Share["POST /api/chats/:id/share"]:::express

    API_STT --> STT_Svc["STTService.ts"]:::logic
    
    %% AI Orchestration
    subgraph "Chat Orchestration (Backend)"
        ChatOrch["ChatOrchestrator.ts\n(Single Agentic Loop)"]:::ai
        Intent["IntentClassifier.ts\n(Language Detection)"]:::logic
        Session["ConversationSession.ts\n(Context & Facts)"]:::logic
        Tools["Tools.ts\n(Function Caller)"]:::logic
    end

    API_Chat --> ChatOrch
    STT_Svc -->|"Transcribed Text"| ChatOrch
    ChatOrch --> Intent
    ChatOrch <--> Session
    ChatOrch <-->|"LLM with Tools"| OpenRouter_API["OpenRouter (LLM)"]:::external
    ChatOrch -->|"If tool call returned"| Tools

    %% Business Logic
    subgraph "Business Services"
        SchemeEng["SchemeEngine.ts"]:::logic
        EmiEng["FinancialEngine.ts (EMI)"]:::logic
        LocSvc["LocationService.ts (Partners)"]:::logic
    end

    Tools -->|"recommend_schemes"| SchemeEng
    Tools -->|"calculate_emi"| EmiEng
    Tools -->|"find_partners"| LocSvc

    %% Database
    subgraph "Database (PostgreSQL)"
        DB_Users[("users")]:::db
        DB_Chats[("chats & chat_messages")]:::db
        DB_Schemes[("schemes")]:::db
        DB_Partners[("partners")]:::db
    end

    SchemeEng <-->|"Queries"| DB_Schemes
    LocSvc <-->|"Queries"| DB_Partners
    Session <-->|"Persist/Load"| DB_Chats
    API_Profile <-->|"User Data"| DB_Users
    API_Share <-->|"Generate share_id"| DB_Chats

    %% Voice/TTS Flow
    ChatOrch -->|"Final Response Text"| TTS_Svc["TTSService.ts"]:::logic
    TTS_Svc -->|"Text"| Sarvam_API["Sarvam AI"]:::external
    STT_Svc -->|"Audio"| Sarvam_API
    
    TTS_Svc -->|"Audio Blob (if Voice-to-Voice)"| VoiceUI
    ChatOrch -->|"Structured Data + Text"| ChatUI
```

---

## 3. Architecture Notes

Based on a deep inspection of the source code, the system operates with the following confirmed architecture:

### A. Technology Stack
- **Frontend Framework:** Next.js (App Router, React 19)
- **Styling:** Tailwind CSS (v4)
- **Backend Framework:** Express.js (TypeScript)
- **Database:** PostgreSQL (accessed via raw SQL queries in `src/db/pool.ts` without an ORM)
- **Authentication:** Custom JWT-based authentication with bcrypt for password hashing.
- **LLM Provider:** OpenRouter API (`openrouter.ts`), utilizing tool-calling models.
- **Speech Services:** Sarvam AI API (used directly for both Speech-to-Text and Text-to-Speech via REST).

### B. Main Data Flows

**1. Text Chat Pipeline**
`User` -> `Chat Composer (Frontend)` -> `POST /api/chat` -> `ChatOrchestrator` -> Loads past messages (`ConversationSession`) -> Identifies language (`IntentClassifier`) -> Calls LLM via OpenRouter.
The LLM can optionally invoke tools defined in `Tools.ts`. If it does, the Orchestrator executes deterministic backend functions (e.g., querying the PostgreSQL database for schemes), returns the JSON results to the LLM, and the LLM produces a grounded natural-language response. Both the raw text and structured tool data are sent back to the Next.js UI and stored in the database.

**2. Voice Pipeline (Two Modes)**
- **Composer Mic (Speech-to-Text):** The user clicks the small microphone icon in the chatbox. The browser records audio and POSTs it to `/api/stt`. The backend sends this buffer to Sarvam AI. The resulting transcript is populated into the text composer for the user to edit and send.
- **"Talk to PradarshakAI" (Voice-to-Voice):** A continuous voice session. Audio is captured, transcribed via Sarvam STT, processed by the same `ChatOrchestrator`, and the text response is sent to `/api/tts` (Sarvam TTS). The audio blob is returned to the frontend and played back automatically.

**3. Scheme Recommendation Architecture**
The system guarantees grounded recommendations by enforcing a strict split: The LLM *understands* the user but *cannot invent* schemes. The LLM triggers the `recommend_schemes` tool. `SchemeEngine.ts` executes raw SQL against the `schemes` table. The exact matching schemes are returned, and the LLM forms a response based *only* on that data. The frontend renders structured `SchemeCard` components using the attached JSON metadata, not just the LLM's text.

**4. Share Chat Flow**
Authenticated users can "Share" a chat. The backend (`chats.ts`) generates a unique `share_id` (e.g., `sh_123xyz`) and updates the `chats` table. A public endpoint `/api/chats/share/:id` allows unauthenticated access to read-only conversation history, fully reconstructing the structured scheme cards for viewers.

### C. Major Application Layers

1. **Client / Browser:** Handles state management, microphone permissions, MediaRecorder APIs, and rendering of structured Markdown/Cards.
2. **Next.js Server:** Primarily serves the React frontend, though it also contains configuration routing.
3. **Express.js API:** The core business layer handling authentication, token validation, and orchestration logic.
4. **AI/Voice Layer:** Specialized services (`STTService`, `TTSService`, `ChatOrchestrator`) that wrap external API calls.
5. **Data Layer:** PostgreSQL database with structured tables (`users`, `chats`, `chat_messages`, `schemes`, `partners`).

### D. Authentication Model
Users register via `userAuth.ts`. Registration can involve OTPs (`OtpService.ts`) and email verification (`EmailService.ts` via Nodemailer). Once authenticated, the server issues a standard JWT. The frontend stores this token and includes it in the `Authorization` header for protected routes (`/api/chat`, `/api/user/profile`, `/api/chats`).

---

## 4. Architecture Observations

While analyzing the codebase, several architectural patterns and observations were noted:

### Strengths & Good Patterns
- **Agentic Tool-Calling:** Merging intent classification and execution into a single "agentic loop" in `ChatOrchestrator.ts` heavily simplifies the backend. It cleanly prevents the LLM from hallucinating scheme data by forcing it to summarize deterministic database queries.
- **Raw SQL over ORM:** The project relies on raw PostgreSQL queries. While verbose, this provides absolute control over indexing and performance, avoiding the "N+1" query problems common in complex recommendation queries.
- **Client/Server Boundary:** There is a very strict and clean boundary between the Next.js frontend (UI only) and the Express.js backend (Business Logic + DB).

### Potential Risks & Considerations
- **LLM Latency Dependency:** Because the Voice-to-Voice flow relies on STT -> LLM (OpenRouter) -> TTS serially, total latency is cumulative. If OpenRouter or Sarvam experience delays, the voice conversation will feel sluggish. There doesn't appear to be aggressive streaming TTS implementation to mask LLM generation time.
- **Voice Interruption (Barge-In):** The implementation appears to be standard request/response for voice. Implementing true continuous VAD (Voice Activity Detection) with interruption (barge-in) over a REST architecture is fundamentally difficult compared to WebSockets or WebRTC.
- **Database Migrations:** Migrations are handled via standalone TypeScript scripts (`migrate-v2.ts`, `migrate-v3.ts`, etc.). As the schema grows, managing state across environments may become brittle without a formal migration runner (e.g., Flyway, Prisma Migrate, or Drizzle).
