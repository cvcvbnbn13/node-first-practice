const express = require('express');
const { body } = require('express-validator');
const User = require('../models/user');
const bcrypt = require('bcryptjs');

const router = express.Router();

const {
  getLogin,
  postLogin,
  postLogout,
  getSignup,
  postSignup,
  getReset,
  postReset,
  getNewPassword,
  postNewPassword,
} = require('../controllers/auth');

router.get('/login', getLogin);
router.post(
  '/login',
  [
    body('email', '請輸入有效的電子信箱').isEmail().normalizeEmail(),
    body('email').custom((value, { req }) => {
      return User.findOne({ email: value }).then(user => {
        if (!user) {
          return Promise.reject('帳號錯誤');
        }
      });
    }),
    body('password')
      .trim()
      .custom((value, { req }) => {
        return User.findOne({ email: req.body.email }).then(user => {
          return bcrypt.compare(value, user.password).then(isMatch => {
            if (!isMatch) {
              return Promise.reject('密碼錯誤');
            }
          });
        });
      }),
  ],
  postLogin
);

router.post('/logout', postLogout);

router.get('/signup', getSignup);
router.post(
  '/signup',
  [
    body('email', '請輸入有效的電子信箱地址')
      .isEmail()
      // express validator 會去偵測custom是返回true false 或是Promise.resolve() Promise.resolve()
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then(user => {
          if (user) {
            return Promise.reject('此E-mail已經被註冊過。');
          }
        });
      })
      .normalizeEmail(),
    body('password', '密碼長度至少需為六位').trim().isLength({ min: 6 }),
    body('confirmPassword')
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('密碼不一致，請重新確認');
        }
        return true;
      }),
  ],
  postSignup
);

router.get('/reset', getReset);
router.post('/reset', postReset);

router.get('/reset/:token', getNewPassword);
router.post('/new-password', postNewPassword);
module.exports = router;
