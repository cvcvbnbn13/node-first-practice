// node內置的加密
const crypto = require('crypto');
// 第三方的加密
const bcrypt = require('bcryptjs');
// node 郵件服務
const nodemailer = require('nodemailer');
// 讓node 郵件服務提供對象設為sendGrid
const sendgridTransport = require('nodemailer-sendgrid-transport');
const User = require('../models/user');
const { validationResult } = require('express-validator');

// sendGrid初始化
const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key:
        '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',
    },
  })
);

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: '登入',
    isAuthenticated: false,
    errorMessage: message,
    oldInput: { email: '', password: '' },
    validationErrors: [],
  });
};

exports.postLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: '登入',
      isAuthenticated: false,
      errorMessage: errors.array()[0].msg,
      oldInput: { email, password },
      validationErrors: errors.array(),
    });
  }
  User.findOne({ email: email })
    .then(user => {
      // 加密對比
      bcrypt
        .compare(password, user.password)
        .then(isMatch => {
          if (isMatch) {
            req.session.isLoggin = true;
            req.session.user = user;
            return req.session.save(err => {
              console.log(err);
              res.redirect('/');
            });
          }
        })
        .catch(err => {
          console.log(err);
          res.redirect('/login');
        });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: '註冊新帳戶',
    isAuthenticated: false,
    errorMessage: message,
    oldInput: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationErrors: [],
  });
};

exports.postSignup = (req, res, next) => {
  const { email, password, confirmPassword } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: '註冊新帳戶',
      isAuthenticated: false,
      errorMessage: errors.array()[0].msg,
      oldInput: { email, password, confirmPassword },
      validationErrors: errors.array(),
    });
  }
  bcrypt
    .hash(password, 12)
    .then(hashPassword => {
      const newUser = new User({
        email,
        password: hashPassword,
        cart: { items: [] },
      });
      return newUser.save();
    })
    .then(result => {
      res.redirect('/login');
      return transporter.sendMail({
        to: email,
        from: 'cvcvbnbn13@gmail.com',
        subject: '胖胖商城註冊成功通知信',
        html: '<h1>你已成功註冊為胖胖商城的新會員!!</h1>',
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: '重置密碼',
    errorMessage: message,
  });
};

exports.postReset = (req, res, next) => {
  // 32位元
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      res.redirect('/reset');
    }
    // 把十六位轉成普通的ASCII
    const token = buffer.toString('hex');
    User.findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          req.flash('error', '此郵件未註冊');
          return res.redirect('/reset');
        }
        user.resetToken = token;
        user.resetTokenInfo = Date.now() + 3600000 * 9;
        return user.save();
      })
      .then(() => {
        return res.redirect('/');
      })
      .then(result => {
        transporter.sendMail({
          to: req.body.email,
          from: 'cvcvbnbn13@gmail.com',
          subject: '重置密碼通知',
          html: `
            <p>已收到您重置密碼的請求</p>
            <p>請點擊此連結以<a href="https://node-for-fattyshop.herokuapp.com/reset/${token}">重置密碼</a>，連結將於一小時後失效</p>
          `,
        });
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  // 這裡的token來自重置密碼的那封信
  const { token } = req.params;
  User.findOne({
    resetToken: token,
    resetTokeInfo: { $gt: Date.now() + 360000 * 8 },
  })
    .then(user => {
      let message = req.flash('error');
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render('auth/newPassword', {
        path: '/new-password',
        pageTitle: '重置密碼',
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postNewPassword = (req, res, next) => {
  const { newPassword, userId, passwordToken } = req.body;
  let resetUser;

  User.findOne({
    resetToken: passwordToken,
    resetTokeInfo: { $gt: Date.now() + 360000 * 8 },
    _id: userId,
  })
    .then(user => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then(hashPassword => {
      resetUser.password = hashPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenInfo = undefined;
      return resetUser.save();
    })
    .then(result => {
      res.redirect('/login');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
