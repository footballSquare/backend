const express = require("express");
const cors = require('cors');
const app = express();
require("dotenv").config();

const allowedOrigins = [
  "https://footballsquare.co.kr",
  "https://www.footballsquare.co.kr"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.use(express.json());

console.log("🚀 서버 시작!");

// =============== 라우터 =============

const accountRouter = require("./router/account/router");
app.use("/account", accountRouter);

const boardRouter = require("./router/board/router");
app.use("/board", boardRouter);

const championshipRouter = require("./router/championship/router");
app.use("/championship", championshipRouter);

const communityRouter = require("./router/community/router");
app.use("/community", communityRouter);

const matchRouter = require("./router/match/router");
app.use("/match", matchRouter);

const teamRouter = require("./router/team/router");
app.use("/team", teamRouter);

// ============== 공통 에러 핸들러 ===========

app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).send({
    message: err.message,
  });
});

app.use((req, res, next) => {
  res.status(404).send({
    message: "연결 실패",
  });
});

// ===========================================

app.listen(8000, '0.0.0.0', () => {
  console.log('8000번 포트에서 웹 서버 실행 중입니다.');
});
