var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var http = require('http');
const expressSession = require('express-session')
const passport = require('passport')
const { Server } = require("socket.io");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

// the message model
var messageModel = require('./routes/messages');

var app = express();
var server = http.createServer(app);
const io = new Server(server);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(expressSession({
  resave: false,
  saveUninitialized: false,
  secret: "hell noo"
}))
app.use(passport.initialize())
app.use(passport.session())
passport.serializeUser(usersRouter.serializeUser())
passport.deserializeUser(usersRouter.deserializeUser())

// Socket.IO handling
io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle room joining logic
  socket.on('joinRoom', (roomName) => {
    socket.join(roomName);
    console.log(`User joined room: ${roomName}`);
  });

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  socket.on('sendMessage', async ({ roomName, senderId, message }) => {
    // code to save message in the mongodb server according to the roomname, sendId and message
    await messageModel.findOneAndUpdate(
      { roomName: roomName },
      {
        $push: {
          messages: {
            senderId: senderId,
            messageSent: message,
          },
        },
      },
      { upsert: true, new: true })


    // Broadcast the message to all users in the room
    io.to(roomName).emit('receiveMessage', { senderId, message });
  })

  // Add more socket event handlers as needed
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



module.exports = app;



var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      // console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      // console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  console.log('Listening on ' + bind);
}