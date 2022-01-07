const http = require('http');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

// middleware的概念
app.use(bodyParser.urlencoded({ extended: false }));
// 直接寫出Public就好了 不需要用到path
app.use(express.static('public'));
app.use('/admin', adminRoutes);
app.use(shopRoutes);

// 404
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, 'views', '404page.html'));
});

// const server = http.createServer(app);
// server.listen(5000);
// 上面兩行等於下面一行

app.listen(5000);
