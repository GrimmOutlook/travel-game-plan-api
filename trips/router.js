'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const config = require('../config');

const {jwtStrategy} = require('../auth');
const {User} = require('../users/models');
const {Trip} = require('./models');

const router = express.Router();

// const jsonParser = bodyParser.urlencoded({ extended: true });   // works in browser, not Postman
const jsonParser = bodyParser.json();      // works in Postman, not browser


passport.use(jwtStrategy);
const jwtAuth = passport.authenticate('jwt', { session: false });

router.get('/', jsonParser, (req, res) => {
  console.log('req.body: ', req.body);
  console.log('req.trip: ', req.trip);
  return Trip
    .find()
    .then(trips => res.json(trips.map(trip => trip)))
    .catch(
      err => {
        console.error(err);
        res.status(500).json({message: 'Something\'s wrong with the trip page.'});
    });

});

router.get('/:tripId', jwtAuth, (req, res) => {
  console.log('req.user: ', req.user);
  console.log(`req.user.username: ${req.user.username}`);
  console.log('req.params.tripId: ' + req.params.tripId);



});













module.exports = {router};
