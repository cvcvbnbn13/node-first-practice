const path = require('path');
const express = require('express');
const rootDirName = require('../utlis/path');
const router = express.Router();

router.get('/', (req, res, next) => {
  res.sendFile(path.join(rootDirName, 'views', 'shop.html'));
});

module.exports = router;
