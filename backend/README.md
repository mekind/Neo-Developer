# Backend (NestJS Mock CRUD)

DB 없이 메모리 내 mock 데이터로 동작하는 간단한 NestJS CRUD 서버.

## 설치 / 실행

```bash
npm install
npm run start:dev
```

기본 포트: `http://localhost:3000`

## 엔드포인트

| Method | Path         | 설명           |
| ------ | ------------ | -------------- |
| GET    | /items       | 전체 목록      |
| GET    | /items/:id   | 단건 조회      |
| POST   | /items       | 생성           |
| PATCH  | /items/:id   | 부분 수정      |
| DELETE | /items/:id   | 삭제           |
| POST   | /memory/users/:userId/bootstrap | 사용자 메모리 폴더/파일 생성 |
| GET    | /memory/users/:userId | 사용자 메모리 상태 조회 |

### 예시

```bash
curl http://localhost:3000/items
curl -X POST http://localhost:3000/items \
  -H 'Content-Type: application/json' \
  -d '{"name":"Tea","price":3000}'
```

## 사용자 메모리 부트스트랩

기본 저장 경로는 `~/.cmux/users/<userId>/` 입니다.
로컬/테스트에서 다른 경로를 쓰려면 `CMUX_MEMORY_ROOT` 환경변수를 지정하세요.

```bash
curl -X POST http://localhost:3000/memory/users/sujin/bootstrap \
  -H 'Content-Type: application/json' \
  -d '{"name":"수진","purpose":"반복업무 자동화","interests":["marketing","ops"]}'

curl http://localhost:3000/memory/users/sujin
```
