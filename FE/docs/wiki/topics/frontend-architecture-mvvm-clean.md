# Frontend Architecture — MVVM + Clean Architecture

## Purpose

이 문서는 `FE/` 기준 프런트엔드 아키텍처의 공통 규칙을 빠르게 합의하기 위한 기준서다.
해커톤 상황에서도 복잡한 구조 논쟁 없이, 기능을 추가할 때 `view`, `domain`, `repository` 중 어디에 책임을 둬야 하는지 바로 판단할 수 있게 하는 것이 목적이다.

## Core Principle

- 상위 분류는 `view`, `domain`, `repository` 로 본다.
- 중요한 것은 **폴더 구조를 완전히 고정하는 것**이 아니라 **레이어 책임 경계**를 고정하는 것이다.
- 구현체 이름이나 세부 파일트리는 프로젝트 상황에 맞게 조정할 수 있다.
- 단, 의존 방향과 책임 혼합은 피한다.

## Layer Overview

```text
View -> Domain -> Repository
```

- `view` 는 사용자 입력과 화면 상태를 다룬다.
- `domain` 은 화면과 저장 방식에 종속되지 않는 기능 규칙을 다룬다.
- `repository` 는 API, storage, 외부 SDK, 서버/로컬 데이터 접근을 다룬다.

## 1) View Layer

## Responsibility
- 화면 렌더링
- 사용자 입력 처리
- UI 상태 관리
- ViewModel 바인딩
- 로딩 / 에러 / empty 상태 표시
- 화면 단위 이벤트 전달

## Should include
- page / screen
- component
- view model
- presentation state
- UI event handler
- route-connected container

## Should not include
- 비즈니스 규칙 자체
- API 호출 상세 구현
- DTO / persistence 포맷 처리
- 저장소 선택 로직
- 여러 화면에서 재사용될 핵심 정책 판단

## View ↔ MVVM rule
- View는 가능한 한 ViewModel을 통해 상태와 액션을 소비한다.
- ViewModel은 화면 친화적인 state/action 형태로 domain 결과를 변환한다.
- View는 “어떻게 보여줄지”에 집중하고 “무엇이 비즈니스적으로 맞는지”는 직접 판단하지 않는다.

## 2) Domain Layer

## Responsibility
- 핵심 비즈니스 규칙
- 유스케이스 / 액션 단위 흐름 정의
- 엔티티 / 모델의 의미 보존
- 입력 검증 규칙
- 화면이 달라도 유지되어야 하는 정책

## Should include
- use case
- domain service
- entity / model
- validation rule
- business policy
- mapper interface가 필요할 경우 그 계약

## Should not include
- React/Vue 컴포넌트 의존 코드
- API 호출 라이브러리 직접 사용
- 로컬 저장소 SDK 직접 접근
- 브라우저 UI 세부 상태
- 특정 백엔드 응답 구조에 강하게 묶인 처리

## Clean Architecture rule
- Domain은 가능하면 가장 오래 살아남는 규칙을 가진다.
- Framework가 바뀌어도 domain 규칙은 유지되는 쪽이 맞다.
- 구현 상세가 필요하면 interface/contract 수준만 domain에 두고, 실제 구현은 repository 쪽에 둔다.

## 3) Repository Layer

## Responsibility
- 외부 데이터 접근
- API 호출
- local storage / session storage / cache 접근
- 서버 응답을 앱 내부에서 쓰기 좋은 형태로 변환
- domain이 요구하는 데이터 계약 구현

## Should include
- repository implementation
- remote/local data source
- fetch client adapter
- response mapper
- persistence adapter

## Should not include
- 화면 렌더링 로직
- 사용자 인터랙션 처리
- 화면 단위 로딩 상태 판단
- 핵심 정책 결정 그 자체

## Supporting sublayers (optional)
해커톤에서는 꼭 세분화할 필요는 없지만, 설명상 아래 보조 개념은 사용할 수 있다.

- `data source`: API / storage 접근 지점
- `mapper`: 외부 응답 ↔ 내부 모델 변환
- `use case`: 특정 사용자 행동 단위의 domain orchestration

이 보조 개념은 **추가 가능**하지만, 1차 기준은 여전히 `view / domain / repository` 3분류다.

## Dependency Rules

## Allowed direction
- `view` -> `domain`
- `domain` -> `repository` contract 또는 필요한 추상화
- `repository` -> 외부 시스템 / API / storage

## Avoid
- `repository` 가 `view` 를 아는 구조
- `domain` 이 UI 프레임워크 세부사항을 아는 구조
- `view` 가 API 상세 응답 구조를 직접 해석하는 구조
- 한 파일/모듈 안에서 UI, 정책, 데이터 접근이 모두 섞이는 구조

## Practical classification rule
새 기능을 넣을 때 아래 질문으로 분류한다.

1. 이것이 화면 표현/입력 처리 문제인가?
   - yes -> `view`
2. 이것이 제품 규칙/검증/행동 정책 문제인가?
   - yes -> `domain`
3. 이것이 외부 데이터/API/storage 연결 문제인가?
   - yes -> `repository`
4. 두 레이어 이상이 동시에 떠오르면?
   - 책임을 분해한다.
   - 화면 판단은 `view`
   - 정책 판단은 `domain`
   - 데이터 취득/저장은 `repository`

## Feature Addition Checklist

새 화면/기능 추가 시 체크:

- [ ] 이 기능의 UI 상태와 사용자 입력 처리는 `view` 에 있는가?
- [ ] 이 기능의 핵심 정책/검증/행동 규칙은 `domain` 으로 분리되어 있는가?
- [ ] API / storage / 외부 SDK 접근은 `repository` 에 모여 있는가?
- [ ] `view` 가 API 응답 포맷을 직접 해석하지 않는가?
- [ ] `domain` 이 특정 UI 프레임워크 세부사항에 의존하지 않는가?
- [ ] `repository` 가 정책 결정을 떠안고 있지 않은가?
- [ ] 세부 파일명은 달라도, 레이어 책임 경계는 유지되는가?

## Recommended document shape for this repo

현재 `FE/` 에서는 아래 정도의 문서 체계를 추천한다.

- 이 문서: 아키텍처 기준서
- 필요 시 후속 문서:
  - screen map
  - state / API dependency map
  - component ownership map

즉, 이 문서는 **모든 상세 설계서**가 아니라, 이후 문서들이 따라야 할 기준 문서 역할을 한다.

## Non-goals for this first pass

- 코드 예시 제공
- 화면별 상세 설계
- 하나의 고정된 파일트리 강제
- 특정 상태관리/DI 도구 선택 강제
- 백엔드 API 명세 자체 정의

## Summary

이 아키텍처의 핵심은 다음 한 줄로 정리할 수 있다.

> 파일 구조보다 레이어 책임 경계를 먼저 고정한다.

해커톤에서는 속도가 중요하므로, 구조를 과설계하지 말고 아래 원칙만 지키면 된다.

- 화면 문제는 `view`
- 제품 규칙은 `domain`
- 외부 연결은 `repository`

## Related
- [[Frontend Workspace Overview]]([Frontend Workspace Overview](frontend-workspace-overview.md))
- [[Frontend Wiki Index]]([Frontend Wiki Index](../_index.md))
