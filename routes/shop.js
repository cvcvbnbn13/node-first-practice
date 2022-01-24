const express = require('express');

const checkAuth = require('../middleware/checkAuth');

const router = express.Router();

const {
  getProduct,
  getIndex,
  getCart,
  getCheckout,
  getOrders,
  postOrders,
  getInvoice,
  getProductDetail,
  postCart,
  postCartDeleteProduct,
} = require('../controllers/shop');

router.get('/', getIndex);

router.get('/products', getProduct);
router.get('/products/:id', getProductDetail);

router.get('/cart', checkAuth, getCart);
router.post('/cart', checkAuth, postCart);
router.post('/cart-delete-item', checkAuth, postCartDeleteProduct);

router.get('/orders', checkAuth, getOrders);
router.get('/orders/:orderId', checkAuth, getInvoice);

router.get('/checkout', checkAuth, getCheckout);
router.get('/checkout/success', postOrders);
router.get('/checkout/cancel', getCheckout);

module.exports = router;
