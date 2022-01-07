const express = require('express');

const path = require('path');

const rootDirName = require('../utlis/path');

const router = express.Router();

// admin/add-product
router.get('/add-product', (req, res, next) => {
  res.sendFile(path.join(rootDirName, 'views', 'add.product.html'));
});

router.post('/add-product', (req, res, next) => {
  console.log(req);
  res.redirect('/');
});

module.exports = router;
