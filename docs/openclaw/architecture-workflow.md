# OpenClaw Architecture & Workflow

이 문서는 OpenClaw의 전체 시스템 구조와 핵심 기능인 `Invoke` 프로세스의 실행 흐름(Workflow)을 다룹니다.

## 1. System Architecture (구조도)

OpenClaw는 모노레포(`AIM/openclaw`) 내에 위치하며, Vercel에 독립적인 서버리스(Next.js App Router) 애플리케이션으로 배포됩니다. 백엔드(NestJS)가 상태와 도메인 로직을 관리하고, OpenClaw는 순수하게 LLM 런타임 환경을 제공하는 **무상태(Stateless) 프록시** 역할을 합니다.

```mermaid
graph TD
    %% Define Styles
    classDef client fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef backend fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef openclaw fill:#fff3e0,stroke:#e65100,stroke-width:2px;
    classDef external fill:#f3e5f5,stroke:#4a148c,stroke-width:2px;
    classDef db fill:#eceff1,stroke:#37474f,stroke-width:2px;

    %% Nodes
    Client["Client (Browser/Game)"]:::client
    Backend["Backend (NestJS)"]:::backend
    OpenClaw["OpenClaw (Next.js/AI SDK)"]:::openclaw
    DB[(Vercel Postgres)]:::db
    Gateway["AI Gateway (Provider)"]:::external
    LLM["LLM (Gemini/Claude)"]:::external
    SearchAPI["External APIs (Search, etc)"]:::external

    %% Connections
    Client -- "POST /users/:uid/agents/:aid/invoke\n(User Request)" --> Backend
    Backend -- "1. Fetch Context\n(SOUL, Config, Memory)" --> DB
    DB -- "Context Data" --> Backend
    Backend -- "2. POST /api/invoke\n(Payload + Context)" --> OpenClaw
    
    OpenClaw -- "3. generateText()\n(System Prompt + Tools)" --> Gateway
    Gateway -- "Route Request" --> LLM
    
    OpenClaw -. "Skill Execution\n(Optional)" .-> SearchAPI
    
    LLM -- "Stream / JSON Response" --> Gateway
    Gateway -- "Response" --> OpenClaw
    
    OpenClaw -- "4. Background Write-back\n(Append Log / Notifications)" --> Backend
    Backend -- "Save Logs" --> DB
    
    OpenClaw -- "5. Return InvokeResponse" --> Backend
    Backend -- "Forward Response" --> Client
```

---

## 2. Invoke Workflow (실행 흐름도)

`POST /api/invoke` 엔드포인트가 호출되었을 때 내부적으로 실행되는 6단계 런타임 파이프라인입니다.

```mermaid
sequenceDiagram
    participant B as Backend (NestJS)
    participant R as Route Handler
    participant G as Guardrails
    participant SP as Prompt Builder
    participant AI as Vercel AI SDK
    participant S as Skill Registry
    
    B->>R: POST /api/invoke (Input, SOUL, Memory)
    activate R
    
    R->>R: 0. Verify Service Token & Zod Parse
    
    R->>G: 3. Preflight Check (Input, Boundaries)
    activate G
    alt Violates Boundaries or Unsafe
        G-->>R: Return { refused: reason }
        R-->>B: Return Static Refusal Response
    else Safe Input
        G-->>R: Pass
    end
    deactivate G
    
    R->>SP: 2. buildSystemPrompt(Context)
    SP-->>R: System Prompt String
    
    R->>R: 4. select-skills (from Config)
    
    R->>AI: 5. generateText({ prompt, system, tools })
    activate AI
    
    opt LLM invokes a tool
        AI->>S: Execute Skill (e.g., insane-search)
        S-->>AI: Tool Result
    end
    
    AI-->>R: text, toolCalls, usage
    deactivate AI
    
    par 6. Write-back (Background)
        R-)B: POST /users/:id/log (Append Log)
    and Return Response
        R-->>B: InvokeResponse (Reply, Tokens, Skills)
    end
    
    deactivate R
```

### 파이프라인 단계 설명

1. **0. 진입 및 검증**: 서비스 토큰(`BACKEND_SERVICE_TOKEN`)을 검증하고, 요청 데이터를 Zod 스키마로 검사합니다.
2. **1. Load Agent**: OpenClaw는 별도로 DB를 조회하지 않습니다. 백엔드가 넘겨준 SOUL과 Memory를 그대로 신뢰하고 사용합니다.
3. **2. Build System Prompt**: SOUL(Identity, Personality, Rules)과 User Memory를 조합하여 일관된 마크다운 기반의 시스템 프롬프트를 직렬화합니다.
4. **3. Guardrails (Pre-LLM)**: LLM을 호출하기 전에 입력이 안전한지, SOUL의 `boundaries`를 침해하지 않는지 검사합니다. 침해 시 비용 발생 없이 즉시 거절 응답을 반환합니다.
5. **4. Select Skills**: 에이전트의 `config.md`에 활성화된 도구들만 레지스트리에서 필터링하여 AI SDK의 `tools` 객체로 매핑합니다.
6. **5. Run (LLM 호출)**: Vercel AI SDK를 통해 모델(Gemini 2.5 Pro 등)을 호출합니다. 에이전트가 필요하다고 판단하면 중간에 Skill을 실행하고 결과를 LLM에 다시 주입합니다.
7. **6. Write-back & Response**: 생성된 응답을 백엔드로 즉시 반환하는 동시에, 백엔드의 대화 기록(`POST /users/:id/log`)이나 알림(`POST /users/:id/notifications`) 엔드포인트를 비동기 백그라운드 작업으로 호출하여 상태를 동기화합니다.
