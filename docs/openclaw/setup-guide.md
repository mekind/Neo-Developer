# Phase 0 Setup Guide (외부 셋업)

OpenClaw 코드 시작 전에 사람이 직접 해야 하는 외부 셋업. 코드로 자동화 불가.
checklist.md Phase 0 항목을 실제로 수행하는 절차.

> 본 가이드 완료 후에야 Phase 1 (스캐폴드)로 진입 가능. 토큰/키가 없어도 mock 모드로 Phase 1~3 일부 진행은 가능 (`local-dev.md` §8 참조).

---

## 1. GitHub / Vercel 프로젝트 권한

### 결정 (D-01 참조)
- **Monorepo 폴더 채택**: `AIM/openclaw/`
- **Vercel 프로젝트는 별도**: `aim-openclaw` (이름 임의)

### 절차

1. 새 GitHub repo는 **만들지 않음** (monorepo 그대로 사용)
2. Vercel 대시보드 → New Project
   - Import: 기존 `mekind/Neo-Developer` 레포 선택
   - **Root Directory**: `AIM/openclaw`
   - Framework Preset: Next.js
   - Build / Install Command: 기본값 (Next.js)
3. **Ignored Build Step** 설정 (Project Settings → Git → Ignored Build Step):
   ```bash
   git diff --quiet HEAD^ HEAD -- ./
   ```
   → `AIM/openclaw/` 외 변경에는 빌드 스킵
4. NestJS Vercel 프로젝트도 동일하게 root directory를 `AIM/backend`로 격리 (이미 셋업되어 있다면 확인)

### AC
- [ ] OpenClaw용 Vercel 프로젝트 생성됨
- [ ] root directory = `AIM/openclaw`
- [ ] Ignored Build Step으로 다른 폴더 변경 시 빌드 스킵 확인
- [ ] preview/production 환경 분리 확인

---

## 2. AI Gateway 셋업

### 절차

1. Vercel 대시보드 → 해당 프로젝트 → AI 탭
2. **AI Gateway** 활성화
3. Provider 추가: **Anthropic** (MVP)
   - Anthropic 콘솔에서 API key 발급 후 등록
   - (선택) OpenAI / Google 등 추가 등록 — fallback용
4. **ZDR (Zero Data Retention)** 옵션 켜기 — 사용자 대화 데이터 외부 보관 방지
5. 프로젝트 env에 `AI_GATEWAY_API_KEY` 자동 주입 확인 (Vercel이 자동 처리)

### 모델 선택 (Phase 0 기준)

| 용도 | 모델 문자열 (AI SDK) | 비고 |
|---|---|---|
| 기본 (속도/비용 균형) | `anthropic/claude-haiku-4-5` | `DEFAULT_MODEL` env에 설정 |
| 복잡 추론 (P1+) | `anthropic/claude-sonnet-4-6` | SOUL.md에 model 필드로 override 가능 |
| 최고 품질 (선택) | `anthropic/claude-opus-4-7` | 비용 큼, MVP 보류 |

> 모델 ID는 항상 `provider/model-id` 포맷. 직접 provider SDK(`@ai-sdk/anthropic`) 안 씀 — AI Gateway 통일.

### AC
- [ ] AI Gateway 활성화
- [ ] Anthropic provider 등록 + API key 검증
- [ ] ZDR 옵션 켜짐
- [ ] 모델 호출 테스트 (Vercel UI의 Playground 또는 curl)
- [ ] `AI_GATEWAY_API_KEY` 프로젝트 env에 존재

---

## 3. 공유 토큰 생성

OpenClaw ↔ NestJS 서비스간 인증 + Vercel Cron 인증용. 두 종류:

| 키 | 용도 | 등록 위치 |
|---|---|---|
| `BACKEND_SERVICE_TOKEN` | OpenClaw ↔ NestJS 서비스간 Bearer | **양쪽 동일 값**: OpenClaw + NestJS Vercel env |
| `CRON_SECRET` | Vercel Cron → OpenClaw 인증 | OpenClaw Vercel env (Vercel이 cron 호출 시 자동 주입) |

### 생성

```bash
# 둘 다 32바이트 랜덤 (base64url)
openssl rand -base64 32 | tr '+/' '-_' | tr -d '='

# 또는 Node
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"

# 또는 1Password / Vercel UI 자동생성 사용
```

### 등록 절차

```bash
# OpenClaw 프로젝트
vercel env add BACKEND_SERVICE_TOKEN
vercel env add CRON_SECRET
vercel env add BACKEND_BASE_URL    # https://aim-backend-...vercel.app
vercel env add DEFAULT_MODEL        # anthropic/claude-haiku-4-5

# NestJS 프로젝트 — 같은 BACKEND_SERVICE_TOKEN, OPENCLAW_BASE_URL 추가
vercel env add BACKEND_SERVICE_TOKEN
vercel env add OPENCLAW_BASE_URL    # https://aim-openclaw-...vercel.app
```

> **주의**: env 값을 한 번이라도 평문으로 git에 커밋하지 말 것. 1Password/Bitwarden 등 시크릿 매니저에 보관.

### AC
- [ ] `BACKEND_SERVICE_TOKEN` 32+ chars 생성
- [ ] OpenClaw + NestJS 양쪽 Vercel env에 동일 값 등록
- [ ] `CRON_SECRET` OpenClaw env에 등록
- [ ] `BACKEND_BASE_URL` (OpenClaw → NestJS 호출용) 등록
- [ ] `OPENCLAW_BASE_URL` (NestJS → OpenClaw 호출용) 등록
- [ ] preview/production 환경별 별도 값 또는 동일 값 정책 결정
- [ ] 시크릿 매니저에 백업

---

## 4. NestJS 페어 작업 등록 ✅

`docs/backend/todo.md` P3 섹션에 **BE-18~22** 등록 완료. (Phase 0에서 처리됨)

OpenClaw 코드 진행 시 NestJS 측 작업이 BE-19/20/21/22가 미완이면:
- Phase 2 (invoke 골격)는 OpenClaw 단독 진행 가능 (mock fixture 사용)
- Phase 5 (write-back), Phase 6 (cron tick)에서 차단됨

---

## 5. Phase 0 완료 체크

다음이 모두 ✅이어야 Phase 1 진입:

- [ ] D-01 결정 반영 (`decisions.md`)
- [ ] OpenClaw용 Vercel 프로젝트 생성
- [ ] AI Gateway + Anthropic provider 셋업
- [ ] 4개 env 등록 완료 (`AI_GATEWAY_API_KEY`, `BACKEND_BASE_URL`, `BACKEND_SERVICE_TOKEN`, `CRON_SECRET`, `DEFAULT_MODEL`)
- [ ] NestJS 측 동일 토큰 + `OPENCLAW_BASE_URL` 등록
- [x] BE-18~22 backend todo 등록

---

## 트러블슈팅

| 증상 | 확인 |
|---|---|
| Vercel이 `AIM/openclaw`을 못 찾음 | New Project 시 root directory 명시 안 함 → 프로젝트 settings에서 수정 |
| AI Gateway 호출 401 | provider key 만료/오타 — Anthropic 콘솔에서 재발급 |
| 모델 not found | 모델 문자열 `provider/model` 포맷 확인, AI Gateway에서 해당 모델 활성화 |
| 양 프로젝트 토큰 불일치 | NestJS와 OpenClaw 양쪽 env 다시 비교, 환경(preview/prod)도 일치 확인 |
