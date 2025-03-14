const { uploadS3 } = require("../database/s3Config/s3UpLoader")
const {deleteFileFromS3} = require("../database/s3Config/s3Deleter")
const client = require("../database/postgreSQL")

// 파일 업로드
const uploadFileToS3 = (folder) => {
  return (req, res, next) => {
    uploadS3(folder).single("file")(req, res, (err) => {
      if (err) {
        // 파일 크기 초과 오류 처리
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ message: "파일 크기가 너무 큽니다. (최대 1MB)" });
        }

        return res.status(400).json({ message: "파일 업로드 실패", error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ message: "업로드된 파일이 없습니다." });
      }

      // 업로드된 파일 URL을 요청 객체에 추가
      req.fileUrl = req.file.location;

      next();
    });
  };
};

// // 기존 이미지 삭제
// const deleteFileMiddleware = async (req, res, next) => {
//   try {
//     const {
//       team_list_name
//     } = req.body
    
//     // DB에서 기존 파일 URL 가져오기
//     const fileRecord = await client.query(
//       `SELECT team_list_emblem
//        FROM team.list
//        WHERE team_list_idx = $1;`, 
//       [team_list_name]
//     );

//     if (!fileRecord.length) {
//       return res.status(404).json({ message: "파일을 찾을 수 없습니다." });
//     }

//     const fileUrl = fileRecord[0].file_url;

//     // S3에서 파일 삭제
//     await deleteFileFromS3(fileUrl);

//     // DB에서 파일 정보 삭제
//     await db.query("DELETE FROM proof_files WHERE id = ?", [fileId]);

//     console.log(`✅ 파일 삭제 완료: ${fileUrl}`);

//     next();
//   } catch (error) {
//     return res.status(500).json({ message: "파일 삭제 실패", error });
//   }
// };

// module.exports = { deleteFileMiddleware };


module.exports = {
    uploadFileToS3
};