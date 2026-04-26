# Backend Architecture

## 스택

- **NestJS 10** (Express 어댑터)
- **TypeScript 5** (strict null checks)
- **class-validator / class-transformer** (DTO 검증)
- **Vercel @vercel/node** (서버리스 배포)
- **Node 20.13.1**

## 디렉터리 구조

```
backend/
├── api/
│   └── index.ts            # Vercel 서버리스 엔트리 (Express 어댑터로 NestApp 감쌈)
├── src/
│   ├── main.ts             # 로컬 실행 엔트리 (node dist/main.js)
│   ├── app.module.ts       # 루트 모듈
│   ├── items/
│   │   ├── items.module.ts
│   │   ├── items.controller.ts
│   │   ├── items.service.ts        # 인메모리 배열 CRUD
│   │   └── dto/
│   │       ├── create-item.dto.ts  # name, description?, price (>= 0)
│   │       └── update-item.dto.ts  # 모든 필드 optional
│   └── memory/
│       ├── memory.module.ts
│       ├── memory.controller.ts
│       ├── memory.service.ts       # ~/.cmux/users 아래 메모리 구조 bootstrap
│       └── dto/
│           └── bootstrap-user-memory.dto.ts
├── vercel.json             # 모든 경로를 api/index.ts로 라우팅
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── package.json
└── package-lock.json
```

## 두 종류의 엔트리 포인트

| 엔트리 | 사용처 | 동작 |
|---|---|---|
| `src/main.ts` | 로컬 (`npm run start`) | 직접 listen, long-running |
| `api/index.ts` | Vercel 프로덕션 | Express 핸들러를 export, 요청마다 호출 (콜드/웜) |

`api/index.ts`는 모듈 스코프에서 NestApp을 한 번만 부트스트랩하고 그 이후에는 캐시된 Express 인스턴스를 재사용합니다. 같은 인스턴스로 들어온 요청끼리는 메모리 상태를 공유하지만, 인스턴스가 새로 뜨면 초기화됩니다.

## 글로벌 설정 (양쪽 엔트리에서 동일 적용)

- `ValidationPipe({ whitelist: true, transform: true })` — 정의되지 않은 필드 자동 strip + 자동 형변환
- `enableCors()` — 모든 origin 허용 (`Access-Control-Allow-Origin: *`)

## 데이터 모델

```ts
interface Item {
  id: string;          // uuid v4
  name: string;
  description?: string;
  price: number;       // >= 0
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}
```

서버 시작 시 mock 2건 (`Mock Coffee`, `Mock Sandwich`) 이 메모리에 적재됩니다.

## 추후 영속화 시 고려사항

현재 `ItemsService`는 단일 클래스가 storage + business logic을 함께 담당합니다. DB 도입 시:

1. `items.repository.ts` (interface + 인메모리 구현)
2. 외부 스토어 어댑터 (예: `items.repository.kv.ts`)
3. `ItemsModule`에서 환경에 따라 provide 교체

레이어 분리 없이 바로 ORM을 박는 것보다 인터페이스 우회가 안전합니다.


## 사용자 메모리 모듈

`MemoryModule`은 사용자별 파일 시스템 메모리 루트를 준비하는 가장 얇은 기반 레이어입니다.

- 기본 루트: `~/.cmux/users/<userId>/`
- 테스트/로컬 격리: `CMUX_MEMORY_ROOT`로 덮어쓰기 가능
- 생성 산출물: `profile.md`, `index.md`, `agents/`
- 보안 가드: `userId`는 영문자/숫자/`-`/`_`만 허용

현재는 **부트스트랩/상태조회만** 담당합니다. 온보딩/페르소나 빌더가 붙으면 이 구조를 확장해서 실제 사용자 정보와 생성 에이전트를 축적하게 됩니다.
