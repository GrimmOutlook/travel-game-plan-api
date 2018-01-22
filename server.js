'use strict';
require('dotenv').config();
const path   = require('path');
// const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const passport = require('passport');

// const jsonParser = bodyParser.json();

const {router: usersRouter} = require('./users');
const {router: tripsRouter} = require('./trips');
const {router: authRouter, localStrategy, jwtStrategy} = require('./auth');

mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require('./config');

const app = express();

// Logging
app.use(morgan('common'));
// app.use(jsonParser); // get information from html forms  // works in Postman, not browser
// app.use(bodyParser.urlencoded({ extended: true }));  // works in browser, not Postman

// Pug views
app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '/views'));

// CORS
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// app.use(passport.initialize());
passport.use(localStrategy);
passport.use(jwtStrategy);

app.use('/api/users/', usersRouter);  // signup
app.use('/api/auth/', authRouter);    // login
app.use('/trip/', tripsRouter);

const jwtAuth = passport.authenticate('jwt', { session: false });

// A protected endpoint which needs a valid JWT to access it
app.get('/api/protected', jwtAuth, (req, res) => {
      console.log('req.user is: ', req.user);
      console.log('Does this work?');
        return res.json({
            data: 'this should print'
        });
    }
);

app.use('*', (req, res) => {
  return res.status(404).json({message: 'Not Found'});
});

// Referenced by both runServer and closeServer. closeServer
// assumes runServer has run and set `server` to a server object
let server;

function runServer() {
  return new Promise((resolve, reject) => {
    mongoose.connect(DATABASE_URL, {useMongoClient: true}, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(PORT, () => {
        console.log(`Your app is listening on port ${PORT}`);
        resolve();
      })
      .on('error', err => {
        mongoose.disconnect();
        reject(err);
      });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
     return new Promise((resolve, reject) => {
       console.log('Closing server');
       server.close(err => {
           if (err) {
               return reject(err);
           }
           resolve();
       });
     });
  });
}

if (require.main === module) {
  runServer().catch(err => console.error(err));
}

module.exports = {app, runServer, closeServer};

