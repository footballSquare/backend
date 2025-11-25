## 1. 프로젝트 개요

- **한 줄 요약**  
  FootballSquare – 온라인 축구 팀/커뮤니티를 위한 매치 매칭, 기록 관리, 게시판, 실시간 팀 채팅을 제공하는 백엔드/채팅 서버.

- **한 문단 설명**  
  FootballSquare 백엔드는 축구(또는 유사 스포츠) 플레이어들을 위한 팀/커뮤니티 기반 플랫폼의 서버 사이드입니다. 사용자는 계정을 생성하고, 팀에 가입하거나 커뮤니티에 참여하며, 팀 매치/공개 매치를 생성·참여하고, 경기 결과와 상세 스탯을 기록할 수 있습니다. 또한 커뮤니티와 게시판 기능을 통해 공지/소통을 하고, 별도의 WebSocket 기반 채팅 서버를 통해 팀 단위 실시간 채팅을 사용할 수 있도록 설계되어 있습니다.

---

## 2. 개발 목적 / 문제 정의

- **해결하려는 문제 또는 불편 (추정)**  
  - FIFA Online/EA FC, 아마추어 축구 동호회 등에서 팀/커뮤니티 운영과 매치 일정 관리, 참가자 모집, 경기 기록·통계를 한 곳에서 관리하기 어렵다는 문제.
  - 카카오톡/디스코드 등으로 소통하면서, 구글 시트로 명단을 관리하는 식의 파편화된 워크플로우를 통합하려는 목적.

- **기획/아이디어 배경 및 확장 가능성 (추정)**  
  - 코드 상에서 매치 스탯, MMR, 챔피언십/상장 기능까지 구현되어 있어, 단순 친선 경기 수준을 넘어 리그/토너먼트 운영까지 지원하려는 의도가 보입니다.
  - 향후에는:
    - 플레이어 MMR 기반 매칭 추천
    - 시즌 랭킹, 어워드 시스템 확장
    - 모바일 앱/웹 클라이언트와의 긴밀한 통합
    로 자연스럽게 확장 가능해 보입니다.

---

## 3. 역할 및 기여도

- **프로젝트 성격 (추정)**  
  - 단일 리포지토리 기준으로 백엔드 + 채팅 서버 + DB 스키마/시드까지 포함하고 있어, 최소한 백엔드 파트는 1인이 주도적으로 개발했을 가능성이 큽니다.
  - 프런트엔드는 별도 레포지토리로 분리되어 있을 가능성이 큽니다(이 리포에는 없음).

- **담당 영역 (추정)**  
  - 백엔드 전반:
    - REST API 설계 및 구현(`src/router/*`, `src/middleware/*`, `src/database/*`)
    - 도메인 모델링 및 SQL 스키마/시드 작성(`DDL.sql`, `insert_defaults.sql`)
    - 인증/인가, 권한 체계, 입력 검증 설계
  - 실시간 채팅 서버:
    - Socket.IO + Redis 기반 채팅 서버(`chat/` 디렉토리 전체)
    - JWT 인증 연동, 팀 룸 모델, 메시지 영속화
  - 인프라:
    - Dockerfile, docker-compose 설계
    - Postgres/Redis 컨테이너 구성 및 로컬 개발 환경 세팅

---

## 4. 기술 스택

- **Backend**
  - Node.js (LTS, `node:22-alpine` Docker 이미지)
  - Express (`src/index.js`, `chat/index.js`)
  - 주요 라이브러리:
    - `pg` – PostgreSQL 클라이언트
    - `redis` – 인증 코드/레이트 리밋 등
    - `jsonwebtoken` – JWT 발급 및 검증
    - `bcrypt` – 비밀번호 해시
    - `multer`, `multer-s3`, `@aws-sdk/client-s3`, `aws-sdk` – 파일 업로드 및 S3 연동
    - `axios` – Discord OAuth 등 외부 API 호출
    - `cookie-parser`, `cors`, `dotenv`

- **Frontend**
  - 해당 리포지토리에는 포함되어 있지 않음 (별도 레포 또는 클라이언트에서 소비하는 순수 API 서버).

- **Database & Storage**
  - PostgreSQL 17 (docker-compose, `DDL.sql`, `insert_defaults.sql`)
    - 스키마: `player`, `team`, `match`, `community`, `championship`, `board`, `common`, `chat`
  - Redis 7
    - SMS 인증 코드/횟수 제한, 채팅 서버 Pub/Sub
  - AWS S3 (또는 S3 호환 스토리지)
    - 프로필 이미지, 팀 엠블럼/배너, 챔피언십 트로피 이미지, 경기 증빙 이미지 저장

- **Infra & DevOps**
  - Docker / docker-compose (`Dockerfile`, `docker-compose.yml`)
  - 개별 서비스용 Dockerfile (`chat/Dockerfile.prod`)
  - CI/CD 설정 파일은 리포지토리에 포함되어 있지 않음.

- **기타**
  - 테스트 프레임워크/도구: 구성만 되어 있고 실제 테스트 없음 (`"test": "echo \"Error: no test specified\"..."`)
  - 모니터링/로그 도구: 별도 라이브러리 없이 `console.log`/`console.error` 기반.

---

## 5. 아키텍처 설계

- **전반적인 시스템 구조**
  - 백엔드:
    - 단일 Express 애플리케이션(모놀리식) 구조.
    - 도메인별 라우터/서비스/SQL 분리를 통해 내부적으로는 모듈화된 레이어드 아키텍처.
  - 채팅 서버:
    - 별도의 Express + Socket.IO 애플리케이션 (`chat/`), Redis Adapter를 통한 Pub/Sub.
    - docker-compose에서 메인 앱과 분리된 서비스로 동작.

- **주요 모듈/레이어**
  - Presentation (HTTP):
    - `src/router/*/router.js` – 라우트 정의, 미들웨어 체인 조합, HTTP 응답 생성.
  - Application / Domain Service:
    - `src/router/*/service.js` – 비즈니스 로직, 복수 쿼리 조합, 트랜잭션 처리.
  - Data Access:
    - `src/router/*/sql.js` – 순수 SQL 문자열 정의.
    - `src/database/postgreSQL.js`, `src/database/redisClient.js` – DB/Redis 클라이언트 초기화.
  - Cross-cutting Concerns:
    - `src/middleware/` – 인증(`checkLogin`), 권한(`checkRole`), 입력 검증(`checkInput`), 데이터 존재 여부(`checkData`), 비즈니스 조건 체크(`checkCondition`), 파일 업로드(`multerMiddleware`, `s3UpLoader`) 등.
    - `src/util/` – `customError`, `trycatchWrapper` 등 에러 처리 공통화.
  - Constants:
    - `src/constant/*` – 도메인 상수(enum), 정규식 정의.

- **설계 패턴**
  - Layered Architecture:
    - Router → Middleware → Service → SQL/DB 순의 단방향 의존.
  - Middleware 패턴:
    - Express 미들웨어 체인을 활용해 인증/인가/검증/조건을 수평 레이어로 분리.
  - 모듈식 도메인 구조:
    - 도메인별 폴더 구조(`account`, `team`, `match`, `community`, `board`, `chat`)로 응집도 높은 모듈 구성.

- **단순 계층 구조 예시 (텍스트)**
  - 클라이언트 → HTTP 요청 → `src/index.js` → `src/router/match/router.js`  
    → `checkLogin` → `checkIdx`/`checkIsMatch`/`checkCondition.*` → `match/service.js` → `match/sql.js` + `pg.Pool.query()` → PostgreSQL

---

## 6. 데이터 모델링

- **주요 엔티티/관계 (요약)**
  - Player 도메인 (`player.list`, `player.refreshtoken`)
    - `player.list`: 플레이어 계정/프로필/플랫폼/포지션/MMR/Discord 정보/상태(`player_status ENUM`).
    - `player.refreshtoken`: 디바이스별 RefreshToken, 만료 시간, 생성 시간.
  - Team 도메인 (`team.list`, `team.role`, `team.member`, `team.waitlist`, `team.history`)
    - `team.list`: 팀 기본 정보(이름/약칭/색상/엠블럼/배너/공지, 상태).
    - `team.role`: 리더/부리더/일반 등 역할 정의.
    - `team.member`: 팀-플레이어 매핑, 역할, 가입 일시.
  - Community 도메인
    - `community.list`: 커뮤니티 기본 정보(이름/공지/배너/엠블럼).
    - `community.role`: 관리자/스태프 등 역할.
    - `community.staff`: 커뮤니티 운영진(플레이어-역할).
    - `community.team`: 커뮤니티와 팀 연결.
    - `community.waitlist`, `community.team_waitlist`: 개인/팀 단위 가입 대기열.
  - Match 도메인
    - `match.type`, `match.position`, `match.formation`: 매치 유형, 포지션, 포메이션 정의.
    - `match.match`: 실제 매치(팀 매치/공개 매치/챔피언십 매치 등), 시작 시간·기간, 속성(공개/비공개/챔피언십), 상태.
    - `match.team_stats`, `match.player_stats`: 팀/개인 경기 스탯, 증빙 이미지(JSONB).
    - `match.participant`: 특정 매치에 특정 시간대에 참여하는 플레이어와 포지션, 시간 범위(`TSTZRANGE`).
    - `match.waitlist`: 매치별 대기열(포지션 단위).
    - `match.mom`: MOM(Man of the Match) 정보.
  - Championship 도메인
    - `championship.list`: 대회 기본 정보(커뮤니티, 타입, 기간, 트로피 이미지, 상태/색상).
    - `championship.participation_team`: 대회 참가 팀들.
    - `championship.award`, `championship.award_winner`, `championship.winner`: 개인/팀 수상, 트로피 이미지.
    - `championship.championship_match`: 대회 매치와 실제 `match.match` 간 연결 및 시간 정보.
  - Board/Chat 도메인
    - `board.list`, `board.comment`, `board.category`: 게시글, 댓글, 카테고리(자유/커뮤니티/팀).
    - `chat.team_chat_message`: 팀 채팅 메시지(내용/작성자/시간/soft delete).

- **중요 제약조건/인덱싱 특징**
  - ENUM 타입 (`player_status`, `platform`)과 `common.status` 테이블로 상태 값 관리.
  - FK/ON DELETE CASCADE/SET NULL을 적극 활용해 참조 무결성 유지.
  - `match.participant`의 `EXCLUDE USING GIST` + `TSTZRANGE`:
    - 한 플레이어가 겹치는 시간 범위에 두 매치에 참가하지 못하도록 DB 레벨에서 강제.
  - `player.refreshtoken`의 `(player_list_idx, device_uuid)` UNIQUE 제약:
    - 한 플레이어-디바이스 조합당 하나의 RefreshToken만 유지.

- **정규화/비정규화 전략 (추정)**
  - 대부분 3정규형에 가깝게 정규화:
    - 상태/코드 값들을 별도 테이블/ENUM으로 분리.
    - 통계/로그 성격의 스탯/채팅 메시지는 일부 JSONB 컬럼을 사용해 유연성 확보.
  - 비정규화:
    - 일부 이름/색상 등을 스냅샷 형태로 중복 저장(예: `team_stats.team_list_name`)하여 나중에 팀 이름이 바뀌어도 당시 기록 유지.

---

## 7. 핵심 기능 정리

아래는 대표 기능 6가지를 기준으로 정리했습니다.

1. **계정 관리 및 인증**
   - 기능 설명:
     - ID/비밀번호 기반 회원가입/로그인, Discord OAuth 로그인, 휴대폰 SMS 인증, 비밀번호 찾기 및 재설정.
   - 흐름:
     - 요청 → `checkRegInputs`로 입력 형식 검증 → `signinCheck`/`signup*` service → DB 조회/삽입(`account/sql.js`) → JWT 발급/Redis에 인증 코드 저장 또는 RefreshToken 저장 → 응답.
   - 구현 포인트:
     - Discord OAuth2 플로우와 자체 회원 시스템을 동시에 지원.
     - SMS 인증 코드/횟수 제한에 Redis TTL 활용.
     - RefreshToken을 DB에 저장하고 `device_uuid`를 통해 여러 기기를 관리.

2. **팀 및 커뮤니티 관리**
   - 기능 설명:
     - 팀 생성/가입/탈퇴, 커뮤니티 운영진/팀 가입 승인·대기열 관리.
   - 흐름:
     - 요청 → `checkLogin`으로 사용자 인증 → `checkRole`(`checkIsTeamLeader`, `checkIsCommunityAdminRole` 등)로 역할 확인 → `checkCondition`으로 중복 가입/대기열 여부 확인 → service에서 DB 트랜잭션으로 멤버십/대기열 테이블 업데이트.
   - 구현 포인트:
     - 권한/상태 검증을 미들웨어 단계에서 대부분 처리하고, 서비스에서는 핵심 비즈니스 로직에 집중.
     - 커뮤니티와 팀 간 관계(`community.team`, `community.team_waitlist`)를 별도 테이블로 분리해 구조 명확.

3. **매치 생성, 참가, 대기열 관리**
   - 기능 설명:
     - 팀 매치/공개 매치 생성, 포지션 단위 참가, 대기열, 매치 마감/삭제, 중복 매치/시간 관리.
   - 흐름:
     - 요청 → `checkIdx`/`checkMatchFormation`/`checkMatchType` 등 입력 검증 → `checkLogin` → `getMatchAndTeamInfo`로 매치 기본 정보 로드 → `checkMatchNotEnded`/`checkMatchOverlap` 등 조건 확인 → `match/service.js`에서 참여/대기열/스탯 테이블 업데이트.
   - 구현 포인트:
     - 매치 시간 중복은 DB `EXCLUDE` 제약 + `checkMatchOverlap`로 2중 방어.
     - 팀 매치/공개 매치/챔피언십 매치를 속성(`MATCH_ATTRIBUTE`)으로 구분하여 재사용 가능한 로직 구성.

4. **게시판 및 댓글 기능**
   - 기능 설명:
     - 카테고리별(자유/커뮤니티/팀) 게시글 CRUD, 좋아요, 댓글 CRUD.
   - 흐름:
     - 요청 → `checkPage`/`checkCategory`/`checkIdx`로 기본 검증 → `checkLogin` + `checkHasTeamOrCommunity`로 소속/권한 확인 → `checkIsPostOwner`/`checkIsCommentOwner` 등으로 주인 여부 확인 → `board/service.js`에서 S3 업로드 URL 반영, 게시글/댓글 DB 조작.
   - 구현 포인트:
     - 게시글/댓글 내용 길이, 제목 길이를 정규식으로 제한해 악의적인 payload 방지.
     - 게시글 이미지 JSONB 컬럼과 S3 업로드 미들웨어로 여러 이미지를 유연하게 관리.

5. **경기 기록 및 통계(스탯) 관리**
   - 기능 설명:
     - 경기 종료 후 팀 스탯(스코어, 슈팅, 패스, 점유율 등) / 개인 스탯(골, 어시스트, 태클, 세이브 등) 기록 및 수정, 증빙 이미지 업로드.
   - 흐름:
     - 요청 → `checkIdx`로 스탯 필드 숫자 여부 검증 → `checkLogin` + `checkIsTeamMemberAtMatch` + `checkIsTeamLeader`로 권한 확인 → `checkMatchStatsPostClosed`로 스탯 입력 가능 상태 확인 → `postTeamStats`/`postPlayerStats`에서 DB insert/update → 증빙 이미지는 `s3UploaderForChampionshipEvidence`로 업로드 후 URL을 JSONB로 저장.
   - 구현 포인트:
     - 기존 증빙 URL을 검증/유지하고 새로 업로드된 URL만 추가하거나 제거하는 로직으로 S3 정합성 유지.
     - MMR/랭킹 시스템과 연계 가능한 데이터 구조.

6. **실시간 팀 채팅**
   - 기능 설명:
     - 팀 단위 실시간 텍스트 채팅, 메시지 영속화 및 조회(페이지네이션).
   - 흐름:
     - WebSocket: 클라이언트가 JWT를 `socket.handshake.auth.token`로 전송 → `chat/index.js`에서 JWT 검증 후 `socket.data.user`에 유저 정보 저장 → `teamChatHandler`에서 `join` 이벤트로 `team_{팀ID}` 룸에 참여 → `message` 이벤트로 메시지 DB insert 후 동일 룸에 브로드캐스트.
     - HTTP: `/chat/team` GET으로 과거 메시지 목록을 페이지 단위로 조회.
   - 구현 포인트:
     - Socket.IO Redis Adapter로 여러 채팅 서버 인스턴스 수평 확장이 가능하도록 구성.
     - 메시지 저장 시 `player.list`와 조인해 닉네임/프로필 이미지를 함께 전송.

---

## 8. 코드 하이라이트 (스니펫)

1. **매치 참가 시간 중복 방지 – Postgres EXCLUDE 제약**
   - 파일/위치: `DDL.sql` – `match.participant` 테이블 정의.
   - 문제:
     - 한 플레이어가 같은 시간대에 여러 매치에 참가하지 못하도록 보장해야 함.
   - 해결:
     - `match_time_range`를 `TSTZRANGE` 타입으로 저장하고,  
       `EXCLUDE USING GIST (player_list_idx WITH =, match_time_range WITH &&)` 제약으로 시간 범위 겹침을 DB 레벨에서 차단.
   - 장점:
     - 애플리케이션 레벨에서 복잡한 동시성 체크를 구현하지 않고도, DB가 강하게 무결성을 보장.
     - Postgres의 고급 기능을 이해하고 활용한 사례로 기술적 깊이를 보여 줄 수 있음.

2. **미들웨어 체인 기반 매치 참가/권한 체크**
   - 파일/위치: `src/router/match/router.js` – 공개 매치 참여 라우트 등.
   - 문제:
     - 매치 참여 시, 입력 검증/포지션 유효성/중복 매치/권한/상태 등 다양한 비즈니스 규칙을 순서 있게 검증해야 함.
   - 해결:
     - `checkIdx` → `checkPosition` → `checkLogin` → `getMatchAndTeamInfo` → `checkIsOpenMatch` → `checkMatchOverlap` → `checkMatchNotEnded` → `checkPositionInFormation` → `checkAlreadyWaitList` → `checkIsTherePositionParticipant` → `joinOpenMatch` 순으로 미들웨어와 서비스 핸들러를 구성.
   - 장점:
     - 각 규칙을 작고 재사용 가능한 미들웨어로 분리해 SRP/DRY를 만족.
     - 라우터 레벨에서 한눈에 “이 엔드포인트에 필요한 모든 조건”을 파악 가능.

3. **인증 미들웨어에서 역할 정보까지 주입**
   - 파일/위치: `src/middleware/checkLogin.js`
   - 문제:
     - 대부분의 도메인 로직이 “플레이어가 어떤 팀/커뮤니티에 소속되어 있고 어떤 역할(리더/스태프)인지”에 의존.
   - 해결:
     - Access Token에서 `my_player_list_idx`만 꺼내는 것이 아니라, 추가 쿼리로 `team.member`, `community.staff`와 LEFT JOIN하여 `my_team_list_idx`, `my_team_role_idx`, `my_community_role_idx`, `my_community_list_idx`를 함께 조회 후 `req.decoded`에 주입.
   - 장점:
     - 이후 모든 미들웨어/서비스에서 공통 구조(`req.decoded`)를 사용해 권한/소속 체크를 일관되게 처리.
     - 권한 구조 변경 시 `checkLogin`만 수정해도 전체 로직이 따라오는 구조.

---

## 9. 성능 및 품질 관리

- **잠재적 병목 지점**
  - DB 중심 로직:
    - 매 요청 시 다수의 미들웨어에서 개별 쿼리를 수행 → 복잡한 엔드포인트의 경우 4~8개 쿼리.
    - 매치/커뮤니티/게시판/채팅 기록 조회 등 read-heavy 엔드포인트가 DB에 부담을 줄 수 있음.
  - 외부 API:
    - Discord OAuth, SMS 발송(Aligo) 등은 네트워크 비용이 크므로 타임아웃/재시도/서킷브레이커 등이 없으면 병목이 될 수 있음.

- **현재 사용 중인 최적화 기법**
  - 페이징:
    - 목록 API 대부분이 `LIMIT 30 OFFSET page*30` 방식으로 페이지네이션 구현.
  - DB 제약 기반 검증:
    - UNIQUE/EXCLUDE 제약을 적극 활용해 애플리케이션 로직 단순화 및 중복 방지.
  - 캐싱:
    - Redis를 SMS 인증 코드, 횟수 제한, 채팅 Pub/Sub에 활용.

- **테스트 전략**
  - 현재 리포지토리에는 실제 테스트 코드가 없고, test 스크립트도 placeholder 상태.
  - 유닛/통합/E2E 테스트, 커버리지 도구(Jest, nyc 등) 사용 흔적 없음.

- **코드 품질 도구**
  - ESLint/Prettier/TypeScript 등 정적 분석/포매터/타입 시스템은 사용하지 않은 것으로 보임.
  - 스타일은 개발자 합의 기반의 자율 형식.

---

## 10. 보안 / 인증 / 권한

- **인증 방식**
  - JWT Access Token:
    - `Authorization` 헤더로 전달, `checkLogin`에서 검증 후 `req.decoded`에 유저/역할 정보 주입.
  - Refresh Token:
    - `player.refreshtoken` 테이블에 저장, `device_uuid`와 함께 관리.
    - 만료 시간 `expires_at` 컬럼으로 관리.
  - OAuth:
    - Discord OAuth2 연동으로 소셜 로그인 지원.
  - SMS 기반 2단계 인증:
    - 휴대폰 번호로 인증 코드 발송 및 검증, Redis에 코드/시도 횟수를 저장.

- **권한 관리 (RBAC + 도메인 규칙)**
  - 역할 상수:
    - `TEAM_ROLE`, `COMMUNITY_ROLE`, `BOARD_CATEGORY` 등.
  - RBAC 미들웨어:
    - `checkIsTeamLeader`, `checkIsTeamSubLeader`, `checkIsCommunityAdminRole`, `checkIsCommunityStaffRole` 등으로 엔드포인트별 접근 제어.
  - 도메인 규칙 기반 인가:
    - `checkIsMatchOwner`, `checkTeamNotJoinedCommunity`, `checkIsPostOwner`, `checkIsCommentOwner` 등.

- **입력 검증 및 공격 방어**
  - 정규식 기반 검증:
    - ID/비밀번호/닉네임/휴대폰 번호/게시글/댓글/날짜/시간 형식 등 `constant/regx.js`에 정의.
  - SQL Injection 방지:
    - 모든 동적 값은 `$1, $2, ...` 바인딩 파라미터 사용.
  - XSS:
    - 서버단에서 HTML/스크립트 sanitize는 별도로 없고, 길이 제한만 존재 → 프론트 또는 향후 서버단 escape/sanitize 필요.

- **민감정보 관리**
  - `.env` 기반 설정:
    - DB/Redis/SMS/S3/Discord OAuth/ JWT secret 등 환경 변수로 관리.
  - 리포지토리에 `.env`는 포함되어 있지 않으며, docker-compose에서 `env_file`을 통해 주입.

---

## 11. 운영 / 배포 / DevOps

- **배포 방식**
  - Docker / docker-compose:
    - `db`(Postgres), `redis`, `app`(Express API), `chat-server`(Socket.IO) 4개 서비스.
    - app/chat 각각 별도 Dockerfile 사용.
  - 백엔드 Dockerfile:
    - 현재 CMD가 `tail -f /dev/null`로 되어 있어, 실제 서버 기동은 `docker exec` 등으로 수동 수행 (개발 편의 중심 설정).

- **CI/CD 파이프라인**
  - 리포지토리에 GitHub Actions/Jenkins 등 CI/CD 설정 파일이 없음.
  - 실제 운영 시에는 별도 레포/인프라에서 관리했을 가능성(추정).

- **로그/모니터링**
  - 코드 상에서 `console.log`/`console.error`만 사용.
  - 로그 수준/포맷/집중 수집(예: ELK, CloudWatch)은 구현되어 있지 않음.

- **환경 분리**
  - `.env` 파일을 통해 기본적인 환경 분리는 가능하지만,
  - dev/stage/prod 분리 전략은 코드/구성에서 명시적으로 드러나지 않음.

---

## 12. 트러블슈팅 및 개선 사례 (추정 포함)

- **DB 레벨 무결성 활용**
  - 문제:
    - 매치 참여 중복, 시간 겹침, 대기열 중복, 챔피언십 특수 규칙 등 복잡한 비즈니스 제약.
  - 해결:
    - `EXCLUDE USING GIST`, UNIQUE 제약, CHECK 제약을 적극 사용해 애플리케이션 로직 대신 DB에서 많은 제약을 강제.
  - 효과:
    - 경합 상황에서도 비정상 데이터가 저장되는 것을 방지하고, 서비스 코드 분량과 복잡도를 낮춤.

- **S3 증빙 이미지 관리 방식**
  - 문제(추정):
    - 경기 증빙 이미지(팀/개인 스탯)의 수정 시, 기존 URL과 새 URL을 어떻게 함께 관리하고, 삭제된 이미지는 S3에서 어떻게 정리할 것인지가 복잡.
  - 해결:
    - `postTeamStatsEvidence`, `postPlayerStatsEvidence`에서 검증된 기존 URL과 새 업로드 URL을 합쳐 최종 리스트를 만들고, 제거된 URL은 S3에서 삭제하는 로직 구현.
  - 효과:
    - DB와 S3 간의 정합성을 유지하면서, 사용자가 증빙 이미지를 유연하게 추가/삭제할 수 있음.

- **권한/소속 정보의 단일 진입점**
  - 문제(추정):
    - 여러 도메인이 플레이어의 팀/커뮤니티/역할에 의존 → 각 도메인에서 중복 조회/검증을 수행하면 유지보수가 어려움.
  - 해결:
    - `checkLogin` 한 곳에서 JWT 검증 + 팀/커뮤니티/역할 조회를 수행하고, `req.decoded`에 공통 구조로 주입.
  - 효과:
    - 권한 구조 변경 시 수정 범위 최소화, 도메인 코드 단순화.

---

## 13. 프로젝트 결과 및 성과

- **운영 여부**
  - 패키지/README 상 GitHub URL(`https://github.com/footballSquare/backend`)이 존재하고, CORS 허용 도메인에도 실제 도메인(`footballsquare.co.kr`)이 하드코딩되어 있어, 실제 서비스로 운영되었을 가능성이 큼(추정).
- **기술적 성과 (추정)**
  - 복잡한 스포츠 도메인을 실제 데이터 모델/비즈니스 로직으로 풀어낸 경험.
  - 실시간 채팅, OAuth, SMS 인증, S3 연동, Redis, Docker 등 다양한 인프라 기술을 하나의 서비스로 통합.

---

## 14. 회고 및 향후 개선 계획 (제안)

- **테스트 및 품질 게이트 도입**
  - Jest 기반 유닛/통합 테스트 추가.
  - 핵심 도메인(인증/매치/커뮤니티/게시판) 시나리오를 자동화 테스트로 커버.
  - CI에서 테스트/린트/빌드를 자동으로 실행하여 품질 게이트 도입.

- **아키텍처 리팩터링**
  - Service 레이어를 UseCase/Domain Service로 분리하여 Router와 DB 의존을 줄이고, 테스트 가능성을 높이기.
  - 권한/도메인 규칙을 도메인 서비스 중심으로 집약해 지나치게 많은 미들웨어를 적절히 정리.

- **보안/프론트 연계 강화**
  - 게시글/댓글 내용의 XSS 방지를 위해 서버단 sanitize 또는 프론트단 escape 전략 명문화.
  - CORS 설정을 `.env` 기반으로 재구성하고, 운영 환경에서만 엄격하게 적용.

- **운영/관측 성숙도 향상**
  - 구조화 로그(winston 등)와 중앙 로그 수집 도입.
  - 간단한 헬스체크, 메트릭(Prometheus 등) 추가로 장애 탐지/모니터링 강화.
  - Dockerfile의 CMD를 prod/dev 분리하여 운영 환경에서는 자동 기동되도록 개선.

---

## 15. 레포지토리 및 참고 링크

- **GitHub Repository**
  - Backend: `https://github.com/footballSquare/backend` (package.json 기준)
- **배포/서비스 URL (추정)**
  - `https://footballsquare.co.kr`
- **기타**
  - API 문서, 프런트엔드 레포지토리, 디자인 시안 등은 현재 리포지토리에서는 확인되지 않음.

