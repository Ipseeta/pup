const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const config = require('./config');
const mongoose = require('mongoose');
const passport = require('passport');
const port = process.env.PORT || 3000;
const baseUrl = process.env.BASE_URL || 'http://localhost:'

const indexRouter = require('./routes/index');
const featureRouter = require('./routes/feature');
const auth = require('./routes/auth')(passport);
console.log(`Server started on ${baseUrl}${port}`);

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

app.use('/', auth);
app.use('/', indexRouter);
app.use('/', featureRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
//mongoose.connect(config.mongoConnectionString);

module.exports = app;
