const express = require('express');

const checkAuth = require('../middleware/checkAuth');
const { body } = require('express-validator');

const {
  getAddProduct,
  postAddProduct,
  getProduct,
  getEditProduct,
  postEditProduct,
  postDeleteProduct,
} = require('../controllers/admin');

const router = express.Router();

router.get('/add-product', checkAuth, getAddProduct);
router.post(
  '/add-product',
  [
    body('title').isString().trim(),
    body('price').isNumeric(),
    body('description').trim(),
  ],
  checkAuth,
  postAddProduct
);

router.get('/products', checkAuth, getProduct);

router.get('/edit-product/:id', checkAuth, getEditProduct);
router.post(
  '/edit-product',
  [
    body('title').isString().trim(),
    body('price').isNumeric(),
    body('description').trim(),
  ],
  checkAuth,
  postEditProduct
);

router.delete('/products/:id', checkAuth, postDeleteProduct);

module.exports = router;
