# 공식 Node.js LTS 버전 사용
FROM node:22-alpine

# 시간대 설정 생략 (기본값이 UTC이므로 굳이 설정할 필요 없음)

# 작업 디렉토리 설정
WORKDIR /app

# package.json 및 package-lock.json 복사 후 패키지 설치
COPY package.json package-lock.json ./
RUN npm install --omit=dev

# 전체 코드 복사
COPY . .

# 디버깅용 - 컨테이너가 종료되지 않도록 유지
CMD ["tail", "-f", "/dev/null"]


