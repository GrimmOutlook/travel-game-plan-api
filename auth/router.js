'use strict';
const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { User } = require('../users/models');
// const User = require('../users/models');

const config = require('../config');
const router = express.Router();
// const jsonParser = bodyParser.urlencoded({ extended: true });  // works in browser, not Postman
const jsonParser = bodyParser.json();          // works in Postman, not browser

const createAuthToken = function(user) {
  return jwt.sign({user}, config.JWT_SECRET, {
    subject: user.username,
    expiresIn: config.JWT_EXPIRY,
    algorithm: 'HS256'
  });
};

const localAuth = passport.authenticate('local', {session: false});
const jwtAuth = passport.authenticate('jwt', { session: false });

router.use(jsonParser);

router.get('/login', (req, res) => {
  res.render('login');
});
// The user provides a username and password to login
router.post('/login', localAuth, (req, res) => {
  const authToken = createAuthToken(req.user.apiRepr());
  console.log("authToken in post /login: ", authToken);
  res.json({"token": authToken});
  // res.redirect('/api/auth/dashboard' + {authToken});
});

// The user exchanges a valid JWT for a new one with a later expiration
router.post('/refresh', jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({authToken});
});

module.exports = {router};
