const { DeleteObjectCommand,DeleteObjectsCommand } = require("@aws-sdk/client-s3");
const s3 = require("./s3Client");

// 단일 삭제
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

// 여러개 삭제
const deleteFilesFromS3 = async (fileUrls) => {
  if (!Array.isArray(fileUrls) || fileUrls.length === 0) return;

  const objectsToDelete = fileUrls
    .filter(Boolean)
    .map((fileUrl) => {
      const urlParts = new URL(fileUrl);
      const filePath = urlParts.pathname.substring(1); // `/` 제거
      return { Key: filePath };
    });

  const deleteParams = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Delete: {
      Objects: objectsToDelete,
      Quiet: false, // true면 응답에 삭제된 키 목록이 생략됨
    },
  };

  try {
    const response = await s3.send(new DeleteObjectsCommand(deleteParams));
    console.log("✅ S3 다중 삭제 완료:", response.Deleted?.map((obj) => obj.Key));
    if (response.Errors && response.Errors.length > 0) {
      console.error("❌ 일부 삭제 실패:", response.Errors);
    }
  } catch (error) {
    console.error("❌ S3 다중 삭제 전체 실패:", error.message);
  }
};

module.exports = {
  deleteFileFromS3,
  deleteFilesFromS3
};