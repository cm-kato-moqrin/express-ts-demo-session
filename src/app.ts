import createError from 'http-errors';
import express from 'express';
import { Request, Response, NextFunction } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';

import router from './routes/users';

import redis from 'redis';
import session from 'express-session';
import connectRedis from 'connect-redis';
const redisClient = redis.createClient();
const app = express();

const redisStore = connectRedis(session);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(
  session({
    secret: 'mysecrets',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
    store: new redisStore({
      client: redisClient,
      host: '127.0.0.1',
      port: 6379,
      prefix: 'demo:',
      ttl: 10,
    }),
  })
);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', router);

// catch 404 and forward to error handler
app.use(function (req: Request, res: Response, next: NextFunction) {
  next(createError(404));
});

// error handler
app.use(function (err: any, req: Request, res: Response, next: NextFunction) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;
