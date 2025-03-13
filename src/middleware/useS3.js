const { uploadS3 } = require("../database/s3Config")

const uploadFileToS3 = (req, res, next) => {
    uploadS3.single("file")(req, res, (err) => {
      if (err) {
        return res.status(500).json({ message: "파일 업로드 실패", error: err });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "업로드된 파일이 없습니다." });
      }
  
      // 업로드된 파일 URL을 요청 객체에 추가
      req.fileUrl = req.file.location;

      console.log(req.fileUrl)
      next();
    });
  };
  
  module.exports = {
    uploadFileToS3
};