const { uploadS3 } = require("./s3UpLoader")
const {deleteFileFromS3} = require("../database/s3Config/s3Deleter")
const client = require("../database/postgreSQL")

// 파일 업로드

const uploadFileToS3 = (folder) => {
  return async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "업로드된 파일이 없습니다." });
      }

      // S3 업로드 로직 (req.file을 그대로 사용)
      const s3UploadResult = await uploadS3(req.file, folder);
      
      if (!s3UploadResult || !s3UploadResult.Location) {
        throw new Error("S3 업로드 실패");
      }

      req.fileUrl = s3UploadResult.location; // 업로드된 파일 URL 저장
      next();
    } catch (err) {
      return res.status(500).json({ message: "파일 업로드 실패", error: err.message });
    }
  };
};

module.exports = {
  uploadFileToS3
};