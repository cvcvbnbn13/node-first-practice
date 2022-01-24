exports.redirectTo404page = (req, res, next) => {
  // res.status(404).sendFile(path.join(__dirname, 'views', '404page.html'));
  res.status(404).render('404page', {
    pageTitle: '找不到此頁面',
    path: '/404',
  });
};

exports.redirectTo500page = (req, res, next) => {
  // res.status(404).sendFile(path.join(__dirname, 'views', '404page.html'));
  res.status(500).render('500page', {
    pageTitle: '錯誤!',
    path: '/500',
  });
};
