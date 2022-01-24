const fs = require('fs');

const deleteFile = path => {
  // unlink刪除與名稱相符的檔案
  fs.unlink(path, err => {
    if (err) {
      throw err;
    }
  });
};

module.exports = deleteFile;
