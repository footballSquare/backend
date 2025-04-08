const multer = require("multer");

const storage = multer.memoryStorage();

const multerMiddleware = multer({ storage }).single("file");

const multerArrayMiddleware = multer({ storage }).array("file");

module.exports = { 
    multerMiddleware,
    multerArrayMiddleware
 };
