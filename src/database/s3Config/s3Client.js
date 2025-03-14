const { S3Client } = require("@aws-sdk/client-s3");
require("dotenv").config({ path: "/app/src/.env" });


// S3 클라이언트 설정
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});


// 설정 내보내기
module.exports = s3;

