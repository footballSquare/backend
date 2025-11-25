<div align="center">

# 🏟️ FootballSquare Backend

팀/커뮤니티 기반 축구 매치 매칭 · 경기 기록 · 게시판 · 실시간 팀 채팅을 제공하는 Node.js 백엔드 서버

</div>

---

## 📌 Overview

FootballSquare Backend는 축구(또는 유사 스포츠) 플레이어를 위한 팀/커뮤니티 플랫폼의 서버 애플리케이션입니다.  
사용자는 계정을 생성하고 팀·커뮤니티에 가입하여 매치를 생성/참여하고, 경기 결과와 스탯을 기록하며, 게시판과 실시간 채팅을 통해 소통할 수 있습니다.

> **키워드**: Express, PostgreSQL, Redis, AWS S3, Socket.IO, Docker

---

## ✨ 주요 기능

- **계정 & 인증**
  - ID/비밀번호 회원가입/로그인
  - Discord OAuth2 연동 로그인
  - 휴대폰 SMS 기반 인증 및 비밀번호 찾기
  - JWT Access/Refresh Token 기반 세션 관리

- **팀 & 커뮤니티**
  - 팀 생성/가입/탈퇴, 역할(리더/부리더/일반) 관리
  - 커뮤니티 운영진/참여 팀 대기열 및 승인/거절

- **매치 & 기록**
  - 팀 매치 / 공개 매치 생성 및 참가
  - 포지션 기반 참가 및 대기열 관리
  - 팀/개인 경기 스탯 기록 및 챔피언십 어워드

- **게시판 & 댓글**
  - 자유/커뮤니티/팀 게시판
  - 게시글 CRUD, 좋아요, 댓글 CRUD
  - 이미지 업로드(AWS S3 + CDN)

- **실시간 팀 채팅 (별도 서비스)**
  - Socket.IO + Redis Pub/Sub 기반 팀 단위 실시간 채팅
  - 채팅 메시지 영속화 및 페이지네이션 조회

---

## 🧱 아키텍처 개요

```text
Client (Web / App)
        │
        ▼
  ┌───────────────┐        ┌───────────────────────┐
  │  API Server   │        │      Chat Server      │
  │ (Express)     │        │ (Express + Socket.IO) │
  └─────┬─────────┘        └──────────┬────────────┘
        │                               │
        ▼                               ▼
  PostgreSQL (match/player/board/...)  Redis (cache, pub/sub)
        │
        ▼
      AWS S3 (이미지, 증빙 자료)
```

- API 서버: `src/index.js`
  - 도메인별 Router / Service / SQL 분리 (`src/router/*`)
  - 공통 미들웨어로 인증, 권한, 검증, 파일 업로드 처리
- 채팅 서버: `chat/index.js`
  - Socket.IO + Redis Adapter 로 팀별 룸 채팅
  - PostgreSQL에 채팅 기록 저장

---

## 🛠 Tech Stack

- **Language & Runtime**
  - Node.js (LTS)

- **Backend Framework**
  - Express

- **Database & Cache**
  - PostgreSQL 17
  - Redis 7

- **Messaging & Realtime**
  - Socket.IO

- **Storage & Infra**
  - AWS S3 (+ CDN 도메인)
  - Docker, docker-compose

- **Auth & Security**
  - JSON Web Token (JWT)
  - bcrypt, Discord OAuth2

---

## 📂 폴더 구조 (요약)

```text
backend/
├─ src/
│  ├─ index.js              # 메인 Express 서버
│  ├─ router/               # 도메인별 라우터/서비스/SQL
│  │  ├─ account/
│  │  ├─ team/
│  │  ├─ match/
│  │  ├─ community/
│  │  ├─ board/
│  │  └─ chat/
│  ├─ middleware/           # 인증, 권한, 검증, 조건 검사 등
│  ├─ database/             # PostgreSQL, Redis, S3 설정
│  ├─ constant/             # ENUM, 정규식 등 상수 정의
│  └─ util/                 # customError, trycatchWrapper 등
├─ chat/                    # 별도 채팅 서버 (Socket.IO)
├─ DDL.sql                  # 전체 DB 스키마 정의
├─ insert_defaults.sql      # 기본 데이터(ENUM, 코드 값 등)
├─ docker-compose.yml       # db / redis / app / chat-server 정의
└─ RUNNING_GUIDE.md         # Docker 기반 실행 가이드
```

---

## 🚀 빠른 시작 (Quick Start)

### 1. 필수 설치

- Docker & Docker Compose

### 2. 환경 변수 파일 준비

`src/.env` 파일에 아래와 같은 항목을 채웁니다. (실제 값은 운영 환경에 맞게 설정)

```env
# PostgreSQL
PGSQL_HOST=db
PGSQL_PORT=5432
PGSQL_USER=admin
PGSQL_PW=secret
PGSQL_DB=footballSquare

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Auth
ACCESS_TOKEN_SECRET=your-access-token-secret
REFRESH_TOKEN_SECRET=your-refresh-token-secret

# AWS S3 & CDN
AWS_S3_BUCKET_NAME=your-bucket
CDN_DOMAIN=https://your-cdn-domain

# OAuth / SMS 등 기타
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DISCORD_REDIRECT_URI=...
SMS_SENDER=...
```

채팅 서버용 `chat/.env` 도 동일한 방식으로 준비합니다 (JWT/Redis 관련 값 공유).

### 3. Docker Compose로 실행

```bash
docker-compose up --build
```

- API 서버: `http://localhost:8000`
- Chat 서버: `http://localhost:3001` (Socket.IO endpoint)

> **참고**: 컨테이너/이미지 기반 실행에 대한 보다 자세한 설명은 `RUNNING_GUIDE.md`를 참고하세요.

---

## 🧪 API 개요

자세한 API 문서(Swagger 등)는 별도 제공되지 않지만, 주요 엔드포인트는 다음과 같이 구성되어 있습니다.

- `POST /account/signin` – 로그인
- `POST /account/signup/*` – 회원가입 단계별 API
- `GET /match/open` – 공개 매치 목록 조회
- `POST /match/open` – 공개 매치 생성
- `GET /community/:community_list_idx` – 커뮤니티 상세 조회
- `GET /board` – 게시글 목록 조회
- `POST /board` – 게시글 작성
- `GET /chat/team` – 팀 채팅 로그 조회

각 라우터별 상세 구현은 `src/router/*/router.js`를 참고하세요.

---

## 🧭 개발 시 참고 사항

- 전역 에러 핸들러 및 커스텀 에러 객체(`customError`)를 사용하므로, 서비스 코드에서는 `throw customError(status, message)` 패턴을 활용하면 됩니다.
- 비즈니스 규칙(권한, 상태, 조건 등)은 대부분 미들웨어 (`middleware/check*`)로 분리되어 있으므로, 새로운 엔드포인트를 추가할 때는 **필요한 미들웨어 조합을 먼저 설계**한 뒤 핸들러를 작성하는 것이 좋습니다.
- DB 스키마 변경 시에는 `DDL.sql`과 관련 `sql.js` 파일을 함께 수정해야 합니다.

---

## 📄 라이선스

이 프로젝트는 `ISC` 라이선스를 따릅니다. 자세한 내용은 `package.json`을 참고하세요.

---

## 🤝 기여

이 리포지토리는 개인/소규모 팀 프로젝트를 위해 작성되었지만,  
코드 리뷰, 이슈 제보, 개선 제안은 언제든 환영합니다.

1. 이슈 등록 또는 PR 생성
2. 변경 의도, 설계 이유, 테스트 방법을 간단히 설명

을 남겨주시면 검토에 큰 도움이 됩니다.
