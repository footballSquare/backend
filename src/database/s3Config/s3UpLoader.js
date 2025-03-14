const multer = require("multer");
const multerS3 = require("multer-s3");
const s3 = require("./s3Client")

const allowedExtensions = ["jpg", "jpeg", "png"];
// 최대 파일 크기 (1MB)
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

const sanitizeFileName = (filename) => {
    return filename
      .normalize("NFD") // 유니코드 정규화
      .replace(/[\u0300-\u036f]/g, "") // 악센트 제거
      .replace(/[^a-zA-Z0-9.-]/g, "_") // 특수문자 제거
      .replace(/\s+/g, "_"); // 공백 -> "_"
};

const uploadS3 = (folder) => {
    return multer({
      storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req, file, cb) {
            const sanitizedFileName = sanitizeFileName(file.originalname);
            const fileName = `${folder}/${Date.now()}-${sanitizedFileName}`;
          cb(null, fileName);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE }, // 파일 크기 제한 (1MB)
      fileFilter: (req, file, cb) => {
        // 확장자 검사
        const ext = file.originalname.split(".").pop().toLowerCase();
        if (!allowedExtensions.includes(ext)) {
          return cb(new Error(`허용되지 않은 확장자입니다: .${ext}`), false);
        }
        cb(null, true);
      },
    });
};
  
  module.exports = {uploadS3};