# 🏗️ 프로젝트 실행 가이드 (Docker 환경)

이 문서는 `footballsquare-env` 및 `footballsquare-db` 컨테이너를 실행하고 개발 환경을 구성하는 방법을 설명합니다.

---

## 📌 1️⃣ Docker Hub에서 최신 이미지 가져오기
```bash
docker pull strangekim027/footballsquare-env:latest
docker pull strangekim027/footballsquare-db:latest
```

---

## 📌 2️⃣ PostgreSQL 컨테이너 실행
```bash
docker run -d \
  --name footballsquare-db \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=footballSquare \
  -p 5432:5432 \
  strangekim027/footballsquare-db:latest
```
### ✅ PostgreSQL이 정상적으로 실행되었는지 확인
```bash
docker ps
```

---

## 📌 3️⃣ 백엔드 컨테이너 실행 (로컬 코드 연결)

```bash
docker run -d \
  --name footballsquare-backend \
  -p 8000:8000 \
  --env-file ./src/.env \
  --link footballsquare-db \
  -v $(pwd)/src:/app/src \
  strangekim027/footballsquare-env:latest
```
### ✅ 백엔드가 정상적으로 실행되었는지 확인
```bash
docker ps
```
### ✅ 실시간 코드 변경 반영 테스트
```bash
docker exec -it footballsquare-backend node /app/src/index.js
```
---

## 📌 4️⃣ bash 를 껏다 켰을시 컨테이너 재시작 방법 (DB → 백엔드 순서)

🔹 **PostgreSQL(footballsquare-db)이 백엔드(footballsquare-backend)보다 먼저 실행되어야 함!**

🔹 **이유:** 백엔드가 시작될 때 DB에 연결을 시도하는데, DB가 꺼져 있으면 연결 실패.

✅ **컨테이너 재시작 방법**
```bash
# 1️⃣ DB 컨테이너 먼저 실행
docker start footballsquare-db 

# 2️⃣ 백엔드 컨테이너 실행
docker start footballsquare-backend
```

✅ 정상 실행 여부 확인
```bash
docker ps
```
🚀 출력 예시
```bash
CONTAINER ID   IMAGE                                     STATUS        PORTS                    NAMES
abc123456789   strangekim027/footballsquare-db:latest    Up 10 sec     0.0.0.0:5432->5432/tcp   footballsquare-db
xyz987654321   strangekim027/footballsquare-env:latest   Up 5 sec      0.0.0.0:3000->3000/tcp   footballsquare-backend
```