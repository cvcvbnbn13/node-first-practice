const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const stripe = require('stripe')(process.env.STRIPE_KEY);

const Product = require('../models/product');
const Order = require('../models/order');

const ITEM_PER_PAGE = 3;
exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalProduct;
  Product.find()
    .countDocuments()
    .then(numProducts => {
      totalProduct = numProducts;
      return Product.find()
        .skip((page - 1) * ITEM_PER_PAGE)
        .limit(ITEM_PER_PAGE);
    })
    .then(products => {
      res.render('shop/index', {
        props: products,
        path: '/',
        pageTitle: '胖胖商城',
        totalProduct,
        hasNextPage: ITEM_PER_PAGE * page < totalProduct,
        hasPreviousPage: page > 1,
        currentPage: page,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalProduct / ITEM_PER_PAGE),
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalProduct;
  Product.find()
    // 計算符合的文件數量，並返回數量值(type: number)
    .countDocuments()
    .then(numProducts => {
      totalProduct = numProducts;
      return Product.find()
        .skip((page - 1) * ITEM_PER_PAGE)
        .limit(ITEM_PER_PAGE);
    })
    .then(products => {
      res.render('shop/product-list', {
        props: products,
        path: '/products',
        pageTitle: '商品總覽',
        totalProduct,
        hasNextPage: ITEM_PER_PAGE * page < totalProduct,
        hasPreviousPage: page > 1,
        currentPage: page,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalProduct / ITEM_PER_PAGE),
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProductDetail = (req, res, next) => {
  const { id } = req.params;
  // 在mongosee中，就算是傳string ID 也會自動轉成ObjectID
  Product.findById(id)
    .then(products => {
      // render第一個參數是檔案路徑 而非url
      res.render('shop/product-detail', {
        product: products,
        pageTitle: products.title,
        path: '/products',
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then(user => {
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: '你的購物車',
        products: products,
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const { productId } = req.body;
  Product.findById(productId)
    .then(product => {
      return req.user.addTocart(product);
    })
    .then(result => {
      res.redirect('/cart');
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const { id } = req.body;
  req.user
    .deleteFromCart(id)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCheckout = (req, res, next) => {
  let products;
  let totalSum = 0;
  req.user
    .populate('cart.items.productId')
    .then(user => {
      products = user.cart.items;
      totalSum = 0;
      products.forEach(product => {
        totalSum += product.quantity * product.productId.price;
      });
      return stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: products.map(p => {
          return {
            name: p.productId.title,
            description: p.productId.description,
            amount: p.productId.price,
            currency: 'usd',
            quantity: p.quantity,
          };
        }),
        success_url:
          req.protocol + '://' + req.get('host') + '/checkout/success',
        cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel',
      });
    })
    .then(session => {
      res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: '結帳頁面',
        sessionId: session.id,
        products,
        totalSum,
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCheckout = (req, res, next) => {};

exports.getOrders = (req, res, next) => {
  // 去order裡面找user.userId 等於 req.user._id的訂單
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: '訂單',
        orders: orders,
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postOrders = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then(user => {
      const products = user.cart.items.map(i => {
        return { data: { ...i.productId._doc }, quantity: i.quantity };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user._id,
        },
        products: products,
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  // orderId 也就是資料庫內的order._id，只是在params是orderId
  const { orderId } = req.params;
  Order.findById(orderId)
    .then(order => {
      if (!order) {
        return next(new Error('查無訂單'));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error('無此權限'));
      }
      const invoiceName = `invoice-${orderId}.pdf`;
      const invoicePath = path.join('data', 'invoices', invoiceName);

      const pdfDoc = new PDFDocument();
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);

      pdfDoc.font('ForPdf/fonts/TaipeiSans.ttf').fontSize(24).text('訂單單據');
      pdfDoc
        .font('ForPdf/fonts/pen.ttf')
        .text('------------------------------------------');
      let totalPrice = 0;
      order.products.forEach(prod => {
        totalPrice += prod.data.price * prod.quantity;
        pdfDoc
          .font('ForPdf/fonts/pen.ttf')
          .text(
            `${prod.data.title} X${prod.quantity}   共${
              prod.data.price * prod.quantity
            }元`
          );
      });
      pdfDoc.text(' ');
      pdfDoc.text(' ');
      pdfDoc.text(' ');
      pdfDoc
        .font('ForPdf/fonts/pen.ttf')
        .text('------------------------------------------');
      pdfDoc.font('ForPdf/fonts/pen.ttf').text(`商品小計 : 共${totalPrice}元`);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'inline; filename="' + invoiceName + '"'
      );
      pdfDoc.end();
    })
    .catch(err => {
      next(err);
    });
};
