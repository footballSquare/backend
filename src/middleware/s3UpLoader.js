const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../database/s3Config/s3Client");

// 허용할 파일 확장자 및 크기 제한
const allowedExtensions = ["jpg", "jpeg", "png"];
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

// 파일명 정리 (특수 문자 제거, 공백 제거)
const sanitizeFileName = (filename) => {
  return filename
    .normalize("NFD") // 유니코드 정규화
    .replace(/[\u0300-\u036f]/g, "") // 악센트 제거
    .replace(/[^a-zA-Z0-9.-]/g, "_") // 특수문자 제거
    .replace(/\s+/g, "_"); // 공백 -> "_"
};

// 이미지를 반드시 필요로 하는 미들웨어
const s3Uploader = (folder) => {
  return async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "업로드된 파일이 없습니다." });
      }

      // ✅ 파일 크기 검증
      if (req.file.size > MAX_FILE_SIZE) {
        return res.status(400).json({ message: `파일 크기가 너무 큽니다. (최대 1MB)` });
      }

      // ✅ 확장자 검증
      const ext = req.file.originalname.split(".").pop().toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        return res.status(400).json({ message: `허용되지 않은 확장자입니다: .${ext}` });
      }

      // ✅ 파일명 정리
      const sanitizedFileName = sanitizeFileName(req.file.originalname);
      const fileName = `${folder}/${Date.now()}-${sanitizedFileName}`;

      // ✅ S3 업로드 실행
      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: fileName,
        Body: req.file.buffer, // ✅ 메모리에서 바로 S3로 업로드 (로컬 저장 X)
        ContentType: req.file.mimetype
      };

      const data = await s3.send(new PutObjectCommand(uploadParams));

      req.fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
      next();
    } catch (err) {
      return res.status(500).json({ message: "파일 업로드 실패", error: err.message });
    }
  };
};

// 이미지 없이도 통과되는 미들웨어
const s3UploaderOptional = (folder) => {
  return async (req, res, next) => {
    try {
      if (!req.file) {
        console.log("⚠️ 파일이 없음, S3 업로드 생략하고 다음 미들웨어 실행");
        return next(); // ✅ 파일 없이 통과
      }

      // ✅ 파일 크기 검증
      if (req.file.size > MAX_FILE_SIZE) {
        return res.status(400).json({ message: `파일 크기가 너무 큽니다. (최대 1MB)` });
      }

      // ✅ 확장자 검증
      const ext = req.file.originalname.split(".").pop().toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        return res.status(400).json({ message: `허용되지 않은 확장자입니다: .${ext}` });
      }

      // ✅ 파일명 정리
      const sanitizedFileName = sanitizeFileName(req.file.originalname);
      const fileName = `${folder}/${Date.now()}-${sanitizedFileName}`;

      // ✅ S3 업로드 실행
      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: fileName,
        Body: req.file.buffer, // ✅ 메모리에서 바로 S3로 업로드 (로컬 저장 X)
        ContentType: req.file.mimetype
      };

      const data = await s3.send(new PutObjectCommand(uploadParams));

      req.fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
      next();
    } catch (err) {
      return res.status(500).json({ message: "파일 업로드 실패", error: err.message });
    }
  };
};


// 여러 이미지 업로드
const s3UploaderMultiple = (folder) => {
  return async (req, res, next) => {
    try {
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({ message: "업로드된 파일이 없습니다." });
      }

      const uploadedUrls = [];

      for (const file of files) {
        // ✅ 크기 제한 확인
        if (file.size > MAX_FILE_SIZE) {
          return res.status(400).json({ message: `파일 크기가 너무 큽니다: ${file.originalname}` });
        }

        // ✅ 확장자 확인
        const ext = file.originalname.split(".").pop().toLowerCase();
        if (!allowedExtensions.includes(ext)) {
          return res.status(400).json({ message: `허용되지 않은 확장자입니다: .${ext}` });
        }

        // ✅ 파일 이름 정리
        const sanitizedFileName = sanitizeFileName(file.originalname);
        const fileName = `${folder}/${Date.now()}-${sanitizedFileName}`;

        // ✅ S3 업로드
        const uploadParams = {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        };

        await s3.send(new PutObjectCommand(uploadParams));

        const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
        uploadedUrls.push(fileUrl);
      }

      // ✅ 결과를 배열로 저장
      req.fileUrls = uploadedUrls;
      next();
    } catch (err) {
      return res.status(500).json({ message: "파일 업로드 실패", error: err.message });
    }
  };
}

module.exports = { 
  s3Uploader,
  s3UploaderOptional ,
  s3UploaderMultiple
};
