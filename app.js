const fs = require('fs');
const path = require('path');
const https = require('https');

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const csrf = require('csurf');
const flash = require('connect-flash');
// multer專門負責 multipart/form-data 尤其主要是uploading files的部分
const multer = require('multer');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const session = require('express-session');
// it can store session for express
const MongoDbStore = require('connect-mongodb-session')(session);

// const privateKey = fs.readFileSync('server.key');
// const certificate = fs.readFileSync('server.cert');

const DB_URL = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.937jz.mongodb.net/myFirstDatabase`;
const app = express();
const store = new MongoDbStore({
  uri: DB_URL,
  collections: 'sessions',
});

// The disk storage engine gives you full control on storing files to disk.
// 兩個可選參數 destination filename 決定上傳檔案要存在哪裡跟檔名是啥
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString().split('T')[0] + '-' + file.originalname);
  },
});
const newFileFilter = (req, file, cb) => {
  // The function should call `cb` with a boolean
  // to indicate if the file should be accepted
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    // To accept the file pass `true`, like so:
    cb(null, true);
  } else {
    // To reject this file pass `false`, like so:
    cb(null, false);
  }
};

// flash message
app.use(flash());

const admitRouter = require('./routes/admin');
const shopRouter = require('./routes/shop');
const authRouter = require('./routes/auth');
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  // mean append
  { flags: 'a' }
);
const {
  redirectTo404page,
  redirectTo500page,
} = require('./controllers/errorpage');

const User = require('./models/user');

// set
app.set('view engine', 'ejs');
app.set('views', 'views');

// use
app.use(helmet());
// app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  multer({ storage: fileStorage, fileFilter: newFileFilter }).single('image')
);

app.use(
  // resave: false 代表只有在session改變時才會重新保存，不會在每一個req,res完成後都保存
  // 這裡面也可以設定cookie
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);
app.use(csrf());

// 創建user
app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      // 由session驅動的 但只供給給request的mongoose model
      // 注意 mongoose data 跟 session data是分開來的
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      next(new Error(err));
    });
});

app.use(express.static('public'));
app.use('/images', express.static('images'));

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggin;
  res.locals.token = req.csrfToken();
  next();
});

// route區
app.use('/admin', admitRouter);
app.use(shopRouter);
app.use(authRouter);

// error page
app.get('/500', redirectTo500page);
app.use(redirectTo404page);

app.use((error, req, res, next) => {
  console.log(error);
  res.status(500).render('500page', {
    pageTitle: '系統錯誤',
    path: '/500',
  });
});

mongoose
  .connect(DB_URL)
  .then(result => {
    // https
    //   .createServer({ key: privateKey, cert: certificate }, app)
    app.listen(process.env.PORT || 3000);
  })
  .catch(err => {
    console.log(err);
  });
