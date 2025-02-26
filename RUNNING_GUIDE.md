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
  -p 3000:3000 \
  --env-file .env \
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
