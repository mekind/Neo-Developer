# Frontend Architecture Note — 2026-04-26

## Summary
- FE 기준 프런트 아키텍처 문서를 MVVM + Clean Architecture 기준으로 정의한다.
- 최상위 분류는 `view`, `domain`, `repository` 를 사용한다.
- 1차 문서는 코드 예시나 고정 파일트리보다 **책임 경계**와 **기능 추가 체크리스트**에 집중한다.

## Why this shape
- 해커톤에서는 빠른 정렬이 중요하다.
- 팀이 같은 기준으로 기능을 나누고 리뷰할 수 있어야 한다.
- 세부 구조 논쟁보다 책임 분리가 먼저다.

## Primary durable page
- [[Frontend Architecture — MVVM + Clean Architecture]]([Frontend Architecture — MVVM + Clean Architecture](../wiki/topics/frontend-architecture-mvvm-clean.md))
