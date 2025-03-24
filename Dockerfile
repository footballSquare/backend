# 공식 Node.js LTS 버전 사용
FROM node:22-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json 및 package-lock.json 복사 후 패키지 설치
COPY package.json package-lock.json ./
RUN npm install --omit=dev

COPY . .

CMD ["pm2-runtime", "src/index.js", "--name", "football-square"]

