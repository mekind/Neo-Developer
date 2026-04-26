# Backend Deployment

`backend/` → GitHub Actions 빌드 → Vercel 호스팅.

## 파이프라인 개요

```
push to main (paths: backend/**)
        │
        ▼
┌─────────────────────────────┐
│  .github/workflows/         │
│   deploy-backend.yml         │
│  (Node 20.13.1, ubuntu)      │
│                             │
│  1. npm ci                  │
│  2. npm run build (nest)    │
│  3. vercel pull (settings)  │
│  4. vercel build --prod     │
│  5. vercel deploy --prebuilt│
└─────────────────────────────┘
        │
        ▼
   Vercel CDN/Functions
   (정적 호스팅 + @vercel/node)
```

빌드는 GitHub Actions에서 수행하고, Vercel은 사전 빌드된 산출물(`.vercel/output/`)을 받아 배포만 합니다 (`--prebuilt` 플래그).

## 트리거 조건

`.github/workflows/deploy-backend.yml`:

- `push` → `main` 브랜치
- 변경 경로가 `backend/**` 또는 워크플로우 파일 자체일 때만
- 수동 실행도 가능 (`workflow_dispatch`)

같은 브랜치 동시 실행은 `concurrency` 그룹으로 cancel-in-progress 처리.

## 필요한 GitHub Secrets

`Settings → Secrets and variables → Actions → Repository secrets`

| Name | 발급처 |
|---|---|
| `VERCEL_TOKEN` | <https://vercel.com/account/tokens> (Full Account scope) |
| `VERCEL_ORG_ID` | `vercel link` 후 `backend/.vercel/project.json`의 `orgId`, 또는 Vercel Team Settings → Team ID |
| `VERCEL_PROJECT_ID` | 위 파일의 `projectId`, 또는 프로젝트 Settings → General → Project ID |

`Environment secrets`가 아닌 `Repository secrets`로 등록합니다 (워크플로우에 `environment:` 선언 없음).

### 최초 1회 — 로컬 link

```bash
cd backend
npx vercel@latest login
npx vercel@latest link              # "Link to existing project? Y" → 선택
cat .vercel/project.json            # orgId, projectId 확인
```

`.vercel/`는 gitignore돼 있어서 push되지 않습니다.

## Vercel 프로젝트 설정 (대시보드)

| 항목 | 값 |
|---|---|
| **Root Directory** | `backend` |
| **Framework Preset** | Other |
| **Build Command** | (비워두기) — `vercel.json` + `@vercel/node`가 처리 |
| **Output Directory** | (비워두기) |
| **Node.js Version** | 20.x |

### Git Integration 비활성화 (중요)

Vercel의 GitHub 자동 배포가 기본 활성화돼 있으면, 한 번의 push에 두 개의 배포가 동시에 돕니다 (Vercel 자동 + GHA). 다음 셋 중 하나로 끄세요:

1. **(권장) Settings → Git → Ignored Build Step** 에 `exit 0` 입력 — 모든 자동 빌드 스킵
2. **Settings → Git → Disconnect** — GitHub 연결 자체 해제
3. **Settings → Git → Production Branch** 를 더미(`_disabled`)로 변경

`vercel deploy --token=...` 호출은 Git Integration 설정과 무관하게 동작합니다.

## 배포 검증

머지 후 Actions 탭에서 워크플로우가 녹색이면:

```bash
curl https://<your-project>.vercel.app/items
```

200 + mock 2건이 보이면 정상.

## 트러블슈팅

| 증상 | 원인/해결 |
|---|---|
| `vercel pull` 실패: project not found | `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` 가 secrets에 없음 또는 오타 |
| 토큰 invalid | 토큰 만료/scope 부족 → 새 토큰 발급 (Full Account / Long expiration) |
| 같은 push에 배포가 2건 생김 | Vercel Git Integration이 켜져 있음 → 위 절차로 비활성화 |
| 404가 일부 경로에서만 발생 | `backend/vercel.json`의 routes 확인 — 모든 경로가 `/api/index.ts`로 가야 함 |
| `POST` 후 `GET`에서 데이터 사라짐 | 서버리스 콜드 인스턴스 분리 — 기대된 동작 (인메모리 mock 한계) |

## 배포 산출물 검증 (로컬)

GHA가 하는 빌드를 로컬에서 흉내내려면:

```bash
cd backend
npm ci
npm run build
npx vercel@latest pull --yes --environment=production --token=$VERCEL_TOKEN
npx vercel@latest build --prod --token=$VERCEL_TOKEN
ls .vercel/output/                   # functions/, config.json
```
