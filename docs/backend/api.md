# Items API

프론트 연동을 위한 엔드포인트 명세.

- **Base URL:** `https://backend-kappa-brown-63.vercel.app`
- **Content-Type:** `application/json`
- **CORS:** 모든 origin 허용

> ⚠️ 데이터는 서버리스 인스턴스 인메모리에만 존재합니다. 인스턴스가 새로 뜨거나 다른 콜드 인스턴스로 라우팅되면 초기 mock 2건으로 리셋됩니다. 연동 검증용으로만 사용하세요.

## Item 스키마

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

## 엔드포인트 요약

| Method | Path | 설명 | 성공 코드 |
| ------ | ---- | ---- | --------- |
| GET | `/items` | 전체 목록 | 200 |
| GET | `/items/:id` | 단건 조회 | 200 |
| POST | `/items` | 생성 | 201 |
| PATCH | `/items/:id` | 부분 수정 | 200 |
| DELETE | `/items/:id` | 삭제 | 200 |

---

## 1. 목록 조회

```
GET /items
```

**Response 200**

```json
[
  {
    "id": "11111111-1111-1111-1111-111111111111",
    "name": "Mock Coffee",
    "description": "A freshly brewed mock coffee",
    "price": 4500,
    "createdAt": "2026-04-26T04:38:29.034Z",
    "updatedAt": "2026-04-26T04:38:29.035Z"
  },
  {
    "id": "22222222-2222-2222-2222-222222222222",
    "name": "Mock Sandwich",
    "description": "Tasty mock sandwich",
    "price": 7800,
    "createdAt": "2026-04-26T04:38:29.035Z",
    "updatedAt": "2026-04-26T04:38:29.035Z"
  }
]
```

---

## 2. 단건 조회

```
GET /items/:id
```

**Response 200** — Item 객체.

**Response 404**

```json
{
  "message": "Item <id> not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

## 3. 생성

```
POST /items
```

**Request Body**

```json
{
  "name": "Tea",
  "description": "green tea",
  "price": 3000
}
```

| 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| `name` | string | ✅ | 빈 문자열 불가 |
| `description` | string | ❌ | — |
| `price` | number | ✅ | `>= 0` |

> 정의되지 않은 필드는 자동 strip됩니다.

**Response 201**

```json
{
  "id": "aba04dfc-3b4a-4e60-8253-f16adb564ba1",
  "name": "Tea",
  "description": "green tea",
  "price": 3000,
  "createdAt": "2026-04-26T04:38:30.034Z",
  "updatedAt": "2026-04-26T04:38:30.034Z"
}
```

**Response 400** (검증 실패)

```json
{
  "message": [
    "price must not be less than 0",
    "price must be a number conforming to the specified constraints"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## 4. 부분 수정

```
PATCH /items/:id
```

**Request Body** (모든 필드 optional, 보낸 필드만 갱신)

```json
{ "price": 3500 }
```

**Response 200** — 갱신된 Item (서버에서 `updatedAt` 자동 갱신).

**Response 404** — 단건 조회와 동일.

---

## 5. 삭제

```
DELETE /items/:id
```

**Response 200**

```json
{
  "id": "aba04dfc-3b4a-4e60-8253-f16adb564ba1",
  "deleted": true
}
```

**Response 404** — 단건 조회와 동일.

---

## 에러 공통 포맷

```ts
interface ApiError {
  statusCode: number;
  error: string;                  // "Bad Request" | "Not Found" | ...
  message: string | string[];     // 검증 실패 시 string[]
}
```

| 상태 | 케이스 |
|---|---|
| 400 | 요청 body 검증 실패 (`POST` / `PATCH`) |
| 404 | 존재하지 않는 `id` (`GET` / `PATCH` / `DELETE` `/items/:id`) |

---

## TypeScript 클라이언트 예시

```ts
const BASE = 'https://backend-kappa-brown-63.vercel.app';

export interface Item {
  id: string;
  name: string;
  description?: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) throw await res.json();
  return res.json();
}

export const listItems = () =>
  fetch(`${BASE}/items`).then(asJson<Item[]>);

export const getItem = (id: string) =>
  fetch(`${BASE}/items/${id}`).then(asJson<Item>);

export const createItem = (body: { name: string; description?: string; price: number }) =>
  fetch(`${BASE}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(asJson<Item>);

export const updateItem = (id: string, body: Partial<Pick<Item, 'name' | 'description' | 'price'>>) =>
  fetch(`${BASE}/items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(asJson<Item>);

export const deleteItem = (id: string) =>
  fetch(`${BASE}/items/${id}`, { method: 'DELETE' }).then(
    asJson<{ id: string; deleted: true }>,
  );
```

## curl quick-test

```bash
BASE=https://backend-kappa-brown-63.vercel.app

curl -s $BASE/items
curl -s -X POST $BASE/items \
  -H 'Content-Type: application/json' \
  -d '{"name":"Tea","price":3000}'
curl -s -X PATCH $BASE/items/<id> \
  -H 'Content-Type: application/json' \
  -d '{"price":3500}'
curl -s -X DELETE $BASE/items/<id>
```


---

> 이 문서는 데모용 `/items` mock 만 다룹니다. P0 도메인(`users`, `memory`, `agents`, `skills`, `greetings`) 의 전체 명세는 Swagger UI(`/docs`) 또는 OpenAPI JSON(`/docs-json`) 을 참고하세요.
