import createError from 'http-errors';
import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import indexRouter from './routes/index.js';
import { fileURLToPath } from 'url';
import logger from './utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
var app = express();
/**
 * Create HTTP server.
 */
var server = http.createServer(app);
const io = new Server(server, {cors: {
  origin: process.env.APP_URL
}});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(cors({
  origin: process.env.APP_URL
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

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

io.on('connection', (socket) => {
  const room = socket.handshake.query.room;
  const username = socket.handshake.query.username;
  if(room && username){
    socket.join(room);
    socket.username = username;
    const payload = {
      room: room,
      socket_id: socket.id,
      username: socket.username
    };
    socket.to(room).emit("connected", payload);
    logger.info("connected to room", payload);
  }else{
    socket.disconnect();
  }

  socket.on("onchange_constraints",(options) => {
    socket.to(room).emit("onchange_constraints",options);
  });

  socket.on("chat_message",(options) => {
    options.username = socket.username;
    socket.to(room).emit("chat_messages",options);
  })

  socket.on("chat_typing_notification", (options) => {
    options.username = socket.username;
    socket.to(room).emit("chat_typing_notification", options);
  })

  socket.on('disconnect', () => {
    socket.to(room).emit("user_disconnected", {
      username:socket.username
    });
    console.log('user disconnected - ',socket.username);
  });
});

export {app, server};
