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

### 예시

```bash
curl http://localhost:3000/items
curl -X POST http://localhost:3000/items \
  -H 'Content-Type: application/json' \
  -d '{"name":"Tea","price":3000}'
```
