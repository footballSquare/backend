const multer = require("multer");

const storage = multer.memoryStorage();

const multerMiddleware = multer({ storage }).single("file");

module.exports = { multerMiddleware };
