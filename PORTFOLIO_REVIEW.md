# FootballSquare Backend 포트폴리오 리뷰

## 1. 아키텍처 및 시스템 디자인 점검

### 1-1. 전반적 구조 및 패턴

- **구조 요약**
  - HTTP API: `express` 기반 모놀리식 앱 (`src/index.js:1`).
    - 라우팅: 도메인별 폴더 (`src/router/account`, `board`, `match`, `community`, `team`, `chat`)로 분리.
    - 각 도메인: `router.js` (HTTP 레이어) –> `service.js` (비즈니스 로직) –> `sql.js` (쿼리 정의) 3단 분리.
    - 공통 레이어: `middleware`(검증/권한/조건), `constant`(Enum), `database`(Postgres, Redis, S3), `util`(에러/try-catch).
  - 실시간 채팅: 별도 서비스 `chat/` (Socket.IO + Redis Pub/Sub + Postgres), 독립 Docker 이미지로 운영 (`chat/Dockerfile.prod:1`).
  - 인프라: `docker-compose.yml`로 `db`(Postgres), `redis`, `app`, `chat-server` 4개 서비스 구성.

- **패턴 관점**
  - 전형적인 **레이어드 아키텍처 + 도메인 모듈화**:
    - 프레젠테이션(라우터) / 비즈니스(service) / 데이터(sql)의 분리가 비교적 잘 되어 있음.
    - 공통 관심사(인증, 권한, 입력 검증, 파일 업로드, 조건 체크)를 **미들웨어 체인**으로 캡슐화.
  - 의존성 방향:
    - 상위 레이어(라우터) → 미들웨어/서비스 → DB 클라이언트/SQL (하위 레이어)로 단방향.
    - DB 클라이언트(`src/database/postgreSQL.js:1`)와 Redis, S3는 직접 require하는 형태로, **인터페이스/포트-어댑터 레벨의 추상화(Dependency Inversion)는 미구현**.

#### 강점

- **도메인 단위 모듈화**
  - `match`, `community`, `account` 등 도메인별로 router/service/sql 분리 → 기능 탐색과 변경 범위 파악이 쉽다.
  - Chat은 별도 레포/서비스(`chat/index.js:1`)로 분리되어 있어 **웹소켓 트래픽과 HTTP 트래픽을 분리 스케일링 가능**.

- **미들웨어 기반의 수평 단면(횡단 관심사) 설계**
  - 입력 검증(`checkInput`, `checkRegInputs`, `checkIdx` 등, `src/middleware/checkInput.js:1`).
  - 인증/인가(`checkLogin`, `optionalLogin`, `checkRole`, `checkCondition` 등).
  - 데이터 존재 여부 체크(`checkData`, `src/middleware/checkData.js:1`).
  - 파일 업로드 & S3 업로드(`multerMiddleware`, `s3Uploader*`, `src/middleware/s3UpLoader.js:1`).
  - 서비스 코드에서 중복을 많이 제거하고, **권한/조건 로직을 라우팅 레벨에서 선언적으로 조합**하는 구조가 잘 잡혀 있다.

- **도메인 모델링과 스키마 구조**
  - 멀티 스키마 사용 (`player`, `team`, `match`, `community`, `championship`, `board`, `chat` 등, `DDL.sql:1`)으로 도메인 경계를 SQL 레벨까지 분할.
  - 상태/코드 값들을 `common.status`, `team.role`, `community.role`, `board.category`, `match.type`, `match.position` 등으로 정규화하고, 서비스 코드에서는 `constantIndex`로 enum화해서 사용.
  - `match.match`, `match.participant`, `match.team_stats`, `match.player_stats` 등 **축구 도메인에 특화된 엔터티/관계 모델링**이 탄탄하다.

- **실시간 채팅 아키텍처**
  - Socket.IO + Redis Adapter (`chat/index.js:6`, `chat/socket.js:1`)로,
    - 채팅 서버를 여러 인스턴스로 스케일아웃 할 준비가 되어 있다.
  - 연결 인증을 WebSocket 핸드셰이크 시 JWT로 처리하고 (`chat/index.js:23`), 소켓 컨텍스트에 사용자 데이터를 넣어 도메인 핸들러에서 사용 → 구조적으로 깔끔하다.

#### 약점 / 개선 포인트

- **의존성 역전 미흡**
  - 서비스 레이어가 `pg.Pool` 인스턴스와 SQL 문자열에 직접 의존 (`service.js` 전반).
  - 테스트와 향후 데이터 소스 교체(예: CQRS, 캐시 레이어 추가)가 어려우며, **포트/어댑터 또는 Repository 인터페이스**가 부재.
  - 개선 제안:
    - `dbClient.query(sql, params)` 인터페이스를 추상화하는 adaptor를 두고, 서비스에서는 인터페이스만 의존하도록 설계.
    - Auth, Match, Board 등 핵심 도메인에는 **UseCase/Service 클래스 또는 함수 모듈**을 도입해 HTTP/DB를 분리.

- **애플리케이션 시작/운영 플로우**
  - backend Dockerfile의 CMD가 `tail -f /dev/null` (`Dockerfile:16`)로 되어 있어, docker-compose만으로는 서버가 자동 기동되지 않는다(가이드에 `docker exec ... node /app/src/index.js`).
  - 포트폴리오 관점에서는 **개발 편의용 설정**이라 해도, 배포용 `Dockerfile.prod` 또는 CMD override가 따로 있었다면 더 좋았을 것.
  - 개선 제안:
    - `app` 서비스용 Dockerfile을 운영/개발로 분리하거나, `CMD ["node", "src/index.js"]` + `docker-compose.override.yml` 로 dev 환경 조정.

- **도메인 간 결합**
  - 여러 미들웨어가 DB 스키마/쿼리 구조를 직접 안다(`checkCondition`, `checkData` 등에서 raw SQL).
  - 규모가 더 커지면 **도메인 서비스/리포지토리 레이어가 미들웨어/라우터 양쪽에 공유**되도록 리팩터링 필요.

---

## 2. 코드 품질 및 개발 관행 점검

### 2-1. DRY/SOLID 관점

#### 강점

- **DRY 측면 – 공통 로직 추출이 잘 되어 있음**
  - 입력 검증: `checkRegInput`, `checkRegInputs`, `checkIdx`, `checkPage` 등 (`src/middleware/checkInput.js`).
  - 인증: `checkLogin`, `optionalLogin` (`src/middleware/checkLogin.js:1`).
  - 권한: `checkRole` 계열(`checkIsTeamLeader`, `checkIsCommunityAdminRole`, `checkHasTeamOrCommunity` 등, `src/middleware/checkRole.js:1`).
  - 조건/상태 체크: `checkMatchEnded`, `checkMatchNotEnded`, `checkMatchOverlap`, `checkIsTherePositionParticipant` 등 (`src/middleware/checkCondition.js`).
  - 에러 처리: `customError`, `trycatchWrapper` (`src/util/customError.js`, `src/util/trycatchWrapper.js`).
  - 이로 인해 라우터는 **“요구 조건을 나열하는 선언적 코드”**가 되어, 읽기 쉽고 중복이 상당 부분 제거됨.

- **SRP(단일 책임 원칙) 준수 예시**
  - `checkLogin`:
    - 역할: 토큰 파싱 → DB에서 현재 팀/커뮤니티 역할 조회 → `req.decoded`에 구조화된 권한 정보 저장 (`src/middleware/checkLogin.js:1`).
    - 비즈니스 로직(예: 매치 생성, 게시글 작성)은 이 미들웨어를 전제로 하므로, 각 도메인 코드에서 로그인/역할 로직을 중복 구현하지 않음.
  - `s3Uploader` 계열:
    - 업로드할 파일의 형식/크기 검증, S3 업로드, URL 생성까지 한 책임에 집중 (`src/middleware/s3UpLoader.js:1`).
    - 서비스 함수는 업로드 결과 URL만 사용하면 되므로, 저장소(S3) 구현 변경에 덜 영향을 받는다.
  - `checkData.checkExistsInDB`:
    - 단순 존재 여부 검증을 공통 화, 다양한 엔티티에 재사용.

- **LSP(리스코프 치환 원칙)**
  - 클래스 상속 구조가 아닌 함수/모듈 조합 스타일이라 LSP 이슈는 거의 없으며, **컴포지션 중심 구조**를 취하고 있어 해당 원칙의 위배는 보이지 않는다.

#### 약점 / 개선 포인트

- **서비스 함수의 책임 범위가 다소 넓음**
  - 예: `src/router/match/service.js`의 여러 함수는
    - (1) 요청 파라미터 파싱
    - (2) 비즈니스 규칙 적용
    - (3) 여러 SQL 쿼리 호출 및 트랜잭션 관리
    - (4) HTTP 응답 생성
    - 을 모두 처리 → SRP 관점에서 “HTTP 레이어”와 “도메인 서비스”가 섞여 있다.
  - 개선 제안:
    - 도메인 로직을 `domain/matchService.js` 같은 모듈로 분리하고, router/service는 이를 래핑하는 구조로 리팩터링.

- **중복 / 산재된 비즈니스 규칙**
  - 매치/커뮤니티/팀 관련 권한/상태 로직이 여러 미들웨어 및 서비스에 나뉘어 있다.
  - 예: 팀/커뮤니티 소속 여부 체크가 `checkRole`, `checkCondition`, 개별 service 함수에서 각각 다른 방식으로 구현되는 부분이 보임.
  - 개선 제안:
    - “팀 도메인 서비스”, “매치 도메인 서비스” 등으로 핵심 규칙을 집중시키고, 미들웨어는 해당 서비스를 호출하는 thin layer로 단순화.

- **오타 및 일부 버그 가능성**
  - `checkIsFormation`이 `formation.list`, `formation_idx`를 대상으로 하는데, DDL은 `match.formation`, `match_formation_idx`를 사용 (`DDL.sql` vs `src/middleware/checkData.js:31`) → 실제 실행 시 404 에러를 항상 던질 가능성.
  - 포트폴리오에서 **이런 부분을 미리 인지하고 있다**는 점을 언급하면, 코드 리뷰/테스트 감수 능력을 보여줄 수 있음.

### 2-2. 에러 및 예외 처리

#### 강점

- **글로벌 예외 처리**
  - `src/index.js` 하단에서 `app.use((err, req, res, next) => { ... })`로 전역 에러 핸들러 구현.
  - `customError(status, message)`를 통해 status/message를 명시적으로 부여하고, 응답 JSON `{ message }` 형태로 통일.

- **라우트 핸들러 예외 포착**
  - 모든 service 함수 export 시 `trycatchWrapper`로 감싸서 async 예외를 `next(e)`로 위임 (`src/router/account/service.js` 마지막 부분 등).
  - 미들웨어들도 내부에서 try/catch 후 `next(e)` 호출 → 예외 흐름이 일정하다.

- **사용자 친화적인 메시지**
  - 대부분의 에러 메시지가 **사용자/비즈니스 관점의 문장**으로 작성되어 있음(“매치가 아직 종료되지 않았습니다”, “이미 해당 포지션에 다른 참가자가 있습니다” 등).

#### 약점 / 개선 포인트

- **로깅 전략 부재**
  - `console.log`, `console.error` 수준의 단순 로깅만 사용.
  - 로그 레벨(INFO/WARN/ERROR), 구조화(JSON), 코릴레이션 ID, 요청 단위 트레이싱 등이 없어 운영 환경에서 문제 분석이 어려울 수 있음.
  - 개선 제안:
    - `winston` 등으로 최소한 level 기반 로그 + JSON 로그 구조화.
    - 에러 핸들러에서 `status>=500` 에러만 별도 채널로 기록(예: error.log).

- **에러 타입 분류 부족**
  - `customError`는 status, message만 담는 단순 Error.
  - 인증/인가/검증/비즈니스 에러 등 타입별 구분이 없어서, 클라이언트가 에러 종류별로 뷰/UX를 세분화하기 어렵다.

### 2-3. 테스트 전략

- **현황**
  - `package.json` 및 `chat/package.json` 모두 `"test": "echo \"Error: no test specified\" && exit 1"`, 실제 테스트 코드 미구현.
  - 유닛/통합/E2E 테스트, 커버리지 도구 사용 흔적 없음.

- **영향**
  - 도메인 로직이 복잡한 매치 일정/참가/대기열/챔피언십/권한 로직에 비해 **테스트 부재는 큰 리스크**.
  - 리팩터링/스키마 변경 시 회귀 버그를 자동으로 잡을 수단이 없다.

- **개선 제안**
  - 단기:
    - `checkInput`, `checkRole`, `checkCondition` 같은 순수 함수/미들웨어부터 Jest 기반 유닛 테스트 추가.
    - 매치 생성/참가/마감, 팀 가입/탈퇴, 커뮤니티 운영진 승인 등 핵심 use-case를 통합 테스트로 최소 5–10개 정도 정의.
  - 중장기:
    - `/tests` 디렉토리 구조 정리, CI에서 테스트 자동 수행.
    - 커버리지 60–70% 정도를 목표로 점진적 확대.

---

## 3. 성능 최적화 및 병목 현상 점검

### 3-1. 잠재적 병목 구간

- **DB 중심 아키텍처**
  - 대부분의 비즈니스 기능이 Postgres 쿼리에 의존.
  - match/community/board 관련 API에서 요청당 다수의 검증 미들웨어 → 각 미들웨어가 개별 `client.query` 호출.
  - 예: 매치 관련 라우트에서 `checkIdx` + `checkIsMatch` + `getMatchAndTeamInfo` + 여러 `checkCondition` 조합 시 **한 요청에 4–8개의 쿼리** 발생 가능.

- **집중 트래픽 가능 지점**
  - 공개 매치 목록, 커뮤니티/팀 게시판, 팀 채팅 조회 등 read-heavy API:
    - `getOpenMatchList`, `getTeamMatchList`, `getBoardList`, `getTeamChat` 등 (`src/router/match/service.js`, `src/router/board/service.js`, `src/router/chat/service.js`).
    - 현재는 모든 조회를 실시간 DB 쿼리로 처리 → 트래픽 급증 시 DB가 첫 병목 지점.

### 3-2. DB 쿼리 최적화 관점

#### 강점

- **정규화 및 제약 조건 활용**
  - 외래키, UNIQUE, CHECK, EXCLUDE 등 제약을 적극 사용해 데이터 무결성 확보 (`DDL.sql`).
  - `match.participant`의 `EXCLUDE USING GIST` + `TSTZRANGE`는 시간 겹침을 DB 레벨에서 막는 고급 패턴으로, **어플리케이션 로직을 단순화하고 동시성 이슈를 예방**한다.

- **페이징 처리**
  - `LIMIT 30 OFFSET page * 30` 패턴으로 대부분 목록 API를 페이징 처리 (`src/router/chat/sql.js:1` 등).

#### 약점 / 개선 포인트

- **인덱스 전략**
  - PK/UNIQUE 외에 자주 필터링/조인에 사용되는 컬럼(예: `team_list_idx`, `community_list_idx`, `player_list_idx`, `match_match_idx`)에 대한 명시적 INDEX 선언이 보이지 않는다.
  - 규모가 커지면 match/board/chat 테이블에서 쿼리 성능 저하 가능성.
  - 개선 제안:
    - 실제 쿼리 패턴에 맞춰 `CREATE INDEX idx_match_team ON match.match(team_list_idx);` 등 보조 인덱스 설계.
    - 대량 데이터가 쌓이는 `match.team_stats`, `match.player_stats`, `board.list`, `chat.team_chat_message`에도 필요 시 파티셔닝/아카이빙 고려.

- **N+1 수준까지는 아니지만, 과도한 다중 쿼리**
  - `checkData.checkExistsInDB` 및 여러 `checkCondition`이 서로 다른 SQL로 존재 → 하나의 도메인 액션에 대해 관련된 정보를 **한 번의 JOIN 쿼리**로 가져오는 형태로 최적화 가능.
  - 예: 매치 상세 조회 시, match 정보 + 팀 정보 + 참가자 목록을 단계적으로 여러 API로 나누지 말고, API 설계/쿼리 레벨에서 한 번에 가져오는 것도 고려.

- **SELECT * 사용**
  - 존재 여부만 확인하는 용도에서도 `SELECT *` 사용 (`checkExistsInDB` 등).
  - 성능 영향은 크지 않지만, 명시적으로 `SELECT 1` 또는 필요한 컬럼만 조회하는 습관이 좋다.

### 3-3. 캐싱 전략

#### 구현된 부분

- **Redis 사용**
  - SMS 인증 코드 및 시도 횟수 제한: `searchPwSend`, `searchPwVerify` 등에서 `redisClient` 활용 (`src/router/account/service.js` 후반부).
    - TTL (`CODE_EXPIRY`), 전송 횟수 제한 (`MAX_SEND_COUNT`, `SEND_COUNT_EXPIRY`) 등으로 **보안 + 성능**을 동시에 고려.
  - Chat 서버 Redis Pub/Sub: Socket.IO Redis adapter (`chat/index.js:17`)로 여러 채팅 인스턴스 간 메시지 동기화.

#### 미흡한 부분

- **읽기 캐시 부재**
  - 매치 목록, 인기 게시판, 팀/커뮤니티 정보 등 read-heavy 엔드포인트에 **HTTP 캐시/Redis 캐시**가 없다.
  - 특히 랭킹/MMR, 커뮤니티 정보, 자주 조회되는 공지 등은 TTL 기반의 cache-aside 패턴을 사용하면 DB 부하를 줄일 수 있음.

- **캐시 무효화 전략**
  - SMS/Chat 외에 캐시를 쓰지 않아서 invalidation 설계 자체가 없는 상태.
  - 향후 캐시를 도입할 경우, **CRUD 이벤트별로 캐시 키를 어떻게 갱신/삭제할지 설계 필요**.

---

## 4. 보안 및 운영(DevOps) 점검

### 4-1. 보안 취약점 관점

#### 강점

- **SQL Injection 방어**
  - 대부분 쿼리가 `$1, $2, ...` placeholder + `client.query(sql, [params])` 형태로 작성되어 있다 (`src/router/account/sql.js`, `src/router/match/sql.js` 등).
  - `checkData.checkExistsInDB`에서도 테이블/컬럼 이름은 코드 상에서만 주입되고, 값은 바인딩 파라미터로 처리 → 동적 SQL 구조지만 Injection 위험은 낮다.

- **비밀번호/토큰 관리**
  - 비밀번호는 `bcrypt`로 해시 후 저장 (`src/router/account/service.js`의 `updatePassword` 등).
  - JWT 비밀키, DB/Redis 접속 정보는 `.env` 기반으로 관리 (`dotenv.config`, `src/database/postgreSQL.js:1`, `src/database/redisClient.js:1`).
  - RefreshToken은 DB 테이블(`player.refreshtoken`)에 저장, `device_uuid`와 함께 UNIQUE 제약 (`DDL.sql`).

- **입력 검증**
  - 정규식 기반 검증(`constant/regx.js`)과 enum 검증(`constant/constantIndex.js`)을 **미들웨어 레벨에서 철저히 수행**:
    - ID/Password/Nickname/Phone/Board Title/Content/Match 시간 형식 등.

#### 약점 / 개선 포인트

- **XSS 대응 미흡**
  - 게시글/댓글 내용(`board_list_content`, `board_comment_content`)은 길이 제한만 있고, HTML/스크립트 태그에 대한 필터링/escape는 안 보인다.
  - 실제 프런트엔드 렌더링 시, 서버 또는 클라이언트에서 XSS 방지(escape or sanitize)가 필요하다.
  - 개선 제안:
    - 서버에서 저장 시 HTML을 sanitize 하거나,
    - 최소한 출력 시에는 escape(템플릿 엔진/프런트에서)한다는 전략을 명확히.

- **CORS 설정**
  - `src/index.js`에 origin whitelist CORS 설정이 있으나 현재는 주석 처리되어 있다.
  - 실서비스라면, origin을 `.env` 또는 설정 파일로 분리하고, CORS 정책을 재활성화하는 것이 안전.

- **토큰/세션 관리 상세**
  - AccessToken 만료 후 RefreshToken 흐름은 구현되어 있으나 (`checkRefreshToken`), RefreshToken 회수/블랙리스트/로그아웃 처리 정책은 코드와 스키마만으로는 완전히 드러나지 않는다.
  - 로그아웃 시 RefreshToken 삭제 여부 등이 명확히 정리되어 있으면 좋음.

### 4-2. 인증/인가(AuthN/AuthZ)

#### 구현 내용

- **인증 (AuthN)**
  - AccessToken: `Authorization` 헤더에 토큰 자체를 넣는 방식(`checkLogin`).
  - RefreshToken: `player.refreshtoken` 테이블에 저장, `device_uuid`와 묶어서 per-device token 관리.
  - Discord OAuth2: `getDiscordSigninPage`, `discordOauthSigninLogic` (`src/router/account/service.js`)에서 OAuth 코드 교환, 신규 계정 생성/로그인 처리.
  - SMS 기반 임시 인증: 회원가입/비밀번호 찾기에서 휴대폰 인증 + 임시 액세스 토큰(`access_token_temporary`) 발급.

- **인가 (AuthZ / RBAC)**
  - 역할 상수: `TEAM_ROLE`, `COMMUNITY_ROLE`, `BOARD_CATEGORY` 등 (`src/constant/constantIndex.js`).
  - `checkRole` 계열 미들웨어로 역할에 따른 접근 제어:
    - `checkIsTeamLeader`, `checkIsTeamSubLeader`, `checkIsCommunityAdminRole`, `checkIsCommunityStaffRole` 등.
    - `checkHasTeamOrCommunity`로 게시판 카테고리별 소속 여부 검증.
  - `checkCondition`의 다양한 체크로 업무 규칙 기반 인가:
    - 매치 오너만 수정/삭제 가능(`checkIsMatchOwner`), 종료되지 않은 매치에서만 참여 가능(`checkMatchNotEnded`), 챔피언십 매치에서만 사용되는 기능 제한(`checkIfChampionshipMatchOnly`).

#### 평가

- RBAC과 도메인 규칙이 **미들웨어 체인으로 체계적으로 구현**되어 있어, 포트폴리오에서 강조하기 좋은 부분이다.
- 다만, **권한/상태 체크가 코드 여러 군데에 산재**해 있어, 도메인 서비스로 한 번 더 추상화하면 유지보수성이 크게 올라갈 것.

### 4-3. 배포 및 모니터링

#### 강점

- **Docker 기반 개발/운영 환경**
  - `docker-compose.yml`에서 DB, Redis, app, chat-server를 한 번에 올릴 수 있도록 정의.
  - DB 초기 스키마/seed SQL (`DDL.sql`, `insert_defaults.sql`)이 포함되어 있어, 로컬/테스트 환경 재현이 쉽다.
  - Chat 서버를 별도 서비스로 구성하여 확장성/격리를 고려.

#### 약점 / 개선 포인트

- **CI/CD 파이프라인 부재**
  - GitHub Actions/Jenkins 등 자동 빌드/배포 설정이 레포에 포함되어 있지 않음.
  - 포트폴리오 상으로는, “현재는 수동 배포이지만, 향후 CI/CD를 어떻게 설계할지”를 설명할 수 있으면 좋다.

- **모니터링/로그 수집**
  - Prometheus/Grafana, ELK/EFK, CloudWatch 등 모니터링/로그 수집 연동 흔적 없음.
  - 최소한 애플리케이션 로그를 파일/STDOUT JSON 형태로 남겨 중앙 수집하는 패턴을 도입하면 운영 성숙도가 올라간다.

---

## 5. 포트폴리오 최종 정리 및 제언

### 5-1. 면접에서 강조할 기술적 강점 5가지

1. **도메인 중심 모듈화 + 미들웨어 체인 설계**
   - 도메인별(router/service/sql) 구조와 공통 미들웨어(`checkInput`, `checkLogin`, `checkRole`, `checkCondition`, `s3Uploader` 등)를 통해 **권한/검증/조건 로직을 재사용 가능한 수평 레이어로 설계**한 점.
2. **탄탄한 데이터 모델링과 고급 Postgres 기능 활용**
   - 멀티 스키마 분리, ENUM/참조 무결성, `TSTZRANGE` + `EXCLUDE USING GIST`로 참가 시간 중복을 DB 레벨에서 차단하는 등, **축구 도메인에 맞는 관계형 모델링을 깊이 있게 수행**한 점.
3. **실서비스 수준의 인증/인가 흐름 구현**
   - JWT Access/Refresh Token, 디바이스별 RefreshToken 관리, Discord OAuth2 로그인, SMS 기반 2차 인증 및 Redis를 활용한 rate limiting까지 **여러 인증 수단을 조합한 현실적인 Auth 플로우**를 구축한 점.
4. **실시간 채팅 서비스의 분리와 수평 확장 고려**
   - Socket.IO + Redis Adapter로 별도 채팅 서버를 구성하고, 팀 단위 룸 모델, 메시지 영속화(Postgres)를 통해 **실시간 기능을 메인 API와 분리하여 설계**한 점.
5. **파일 업로드 및 외부 스토리지 연동 책임 분리**
   - `multer` + AWS S3 + CDN 도메인을 이용한 업로드 파이프라인을 `s3Uploader*` 미들웨어로 캡슐화하여, **도메인 로직과 인프라 디테일을 분리**한 점.

### 5-2. 면접에서 솔직하게 인정하고 개선 의지를 보일 약점 2가지

1. **자동화된 테스트 및 품질 게이트 부재**
   - 현재 프로젝트에는 유닛/통합/E2E 테스트가 없고, CI에서 커버리지를 확인하는 체계도 없다.
   - “실제 프로젝트를 진행하며 기능 구현과 스키마 설계에 집중했고, 다음 단계로는 Jest를 통한 도메인 단위 테스트와 CI 파이프라인을 구축해 품질을 체계적으로 관리하고 싶다”고 설명하는 것이 좋다.

2. **운영/관측(Observability) 및 일부 인프라 설정의 미성숙**
   - 로깅이 `console.log` 수준이고, Dockerfile의 CMD가 dev 중심(`tail -f /dev/null`)인 점, CORS 설정이 하드코딩/주석 상태인 점 등.
   - “현재는 소규모 개인/팀 프로젝트 수준의 운영이었고, 다음에는 구조화 로그, 모니터링, 헬스체크, CI/CD를 포함한 **프로덕션 운영 관점**에서 설계를 더 보완하겠다”고 정리하면 좋다.

### 5-3. 포트폴리오용으로 가장 인상적인 코드 스니펫 제안

**추천 스니펫: Postgres를 활용한 매치 참가 시간 중복 방지 설계 (`DDL.sql` 중 `match.participant` 테이블)**

```sql
CREATE TABLE match.participant (
  match_participant_idx SERIAL PRIMARY KEY,
  match_match_idx INT NOT NULL REFERENCES match.match(match_match_idx) ON DELETE CASCADE,
  player_list_idx INT REFERENCES player.list(player_list_idx) ON DELETE SET NULL,
  match_time_range TSTZRANGE NOT NULL,
  CONSTRAINT unique_participation_time 
    EXCLUDE USING GIST (player_list_idx WITH =, match_time_range WITH &&)
      WHERE (player_list_idx IS NOT NULL)
);
```

**선정 이유**

- 단순한 CRUD를 넘어서, **도메인 규칙(한 플레이어는 같은 시간대에 두 매치에 동시에 참여할 수 없다)**를 DB 레벨에서 강제하고 있다.
- Postgres의 `TSTZRANGE`와 `EXCLUDE USING GIST`를 이해하고 활용해야 구현 가능한 패턴으로,
  - 애플리케이션 레벨에서 concurrency 이슈를 복잡하게 처리하지 않고,
  - DB가 제공하는 강력한 제약 기능을 적극 활용한 설계라는 점에서 **데이터베이스/도메인 모델링에 대한 깊은 이해**를 보여준다.
- 면접에서 이 스니펫을 중심으로,
  - 왜 이런 제약을 두었는지(도메인 요구사항),
  - 다른 대안(애플리케이션 레벨 체크 vs DB 제약)과 비교한 장단점,
  - 인덱스/성능 측면 고려 사항,
  - 트랜잭션/동시성 상황에서 어떻게 동작하는지
  를 설명하면, **아키텍트 관점의 사고와 RDBMS 활용 능력**을 강하게 어필할 수 있다.

