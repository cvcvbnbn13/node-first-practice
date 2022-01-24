const mongoose = require('mongoose');
const fileDelete = require('../utlis/file');

const Product = require('../models/product');
const { ObjectId } = require('mongodb');
const { validationResult } = require('express-validator');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: '商品上架',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: [],
  });
};

exports.postAddProduct = (req, res, next) => {
  const { title, description, price } = req.body;
  // 來自input type="file"
  const image = req.file;
  const errors = validationResult(req);
  // 特別針對image的報錯
  if (!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: '商品上架',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title,
        price,
        description,
      },
      errorMessage: '無上傳附件檔案或是附件檔案格式錯誤',
      validationErrors: [],
    });
  }
  // 如果沒有經過route的審查，進到這裡
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: '商品上架',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title,
        price,
        description,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  const imgUrl = image.path;
  const product = new Product({
    title,
    price,
    description,
    // 資料庫裡的圖片是去儲存本地端的path
    imgUrl,
    userId: req.user._id,
  });
  product
    .save()
    .then(result => {
      res.redirect('/admin/products');
    })
    .catch(err => {
      // res.redirect('/500');
      // 透過next傳遞error 是讓express知道錯誤發生，並跳過其他middleware直接處理錯誤這個middleware
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  Product.find({ userId: req.user._id })
    .then(products => {
      res.render('admin/products', {
        props: products,
        path: '/admin/products',
        pageTitle: '管理後臺',
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const { edit } = req.query;
  const { id } = req.params;
  if (edit !== 'true') {
    return res.redirect('/');
  }
  Product.findById(id)
    // Product.findByPk(id)
    .then(product => {
      if (!product) {
        alert('Product not found');
        res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: true,
        product: product,
        hasError: false,
        errorMessage: null,
        validationErrors: [],
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const { id, title, description, price } = req.body;
  const updatedTitle = title;
  const image = req.file;
  const updatedPrice = price;
  const updatedDescription = description;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: '編輯商品資訊',
      path: `/admin/edit-product`,
      editing: true,
      hasError: true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDescription,
        _id: id,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }
  // 先找到要更新的物件
  // 開始更新
  // save
  // return save的結果
  Product.findById(id)
    .then(product => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect('/');
      }
      product.title = updatedTitle;
      product.description = updatedDescription;
      product.price = updatedPrice;
      if (image) {
        fileDelete(product.imgUrl);
        // 如果image是false 代表沒有上傳新檔案
        product.imgUrl = image.path;
      }
      return product.save().then(() => {
        res.redirect('/admin/products');
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postDeleteProduct = (req, res, next) => {
  const { id } = req.params;
  // 或是findByIdAndRemove(id)
  Product.findById({ _id: id })
    .then(product => {
      if (!product) {
        return next(new Error('Product not found'));
      }
      fileDelete(product.imgUrl);
      return Product.deleteOne({ _id: id, userId: req.user._id });
    })
    .then(() => {
      res.status(200).json({ message: '刪除成功' });
    })
    .catch(err => {
      res.status(500).json({ message: '刪除失敗' });
    });
};
