const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("./s3Client");

const deleteFileFromS3 = async (fileUrl) => {

    console.log("fileUrl:", fileUrl)
    if (!fileUrl) return;
  
    const urlParts = new URL(fileUrl);
    const filePath = urlParts.pathname.substring(1); // 앞의 `/` 제거

    console.log(`🗑 S3 삭제 대상 경로: ${filePath}`);
  
    const deleteParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: filePath,
    };
  
    try {
      await s3.send(new DeleteObjectCommand(deleteParams));
      console.log(`✅ S3 파일 삭제 완료: ${filePath}`);
    } catch (error) {
      console.error(`❌ S3 파일 삭제 실패: ${error.message}`);
    }
  };

  module.exports = {deleteFileFromS3};