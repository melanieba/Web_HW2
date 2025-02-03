
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/signup', require('./routes/signup'));
app.use('/login', require('./routes/login'));
app.use('/logout', require('./routes/logout'));
app.use('/profile', require('./routes/profile'));
app.use('/playlist', require('./routes/playlist'));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

module.exports = app;