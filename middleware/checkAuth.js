// 避免未登入時就能透過輸入網址前往各分頁
const checkAuth = (req, res, next) => {
  if (!req.session.isLoggin) {
    return res.redirect('/login');
  }
  next();
};

module.exports = checkAuth;
