'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const config = require('../config');
const uuidv1 = require('uuid/v1');

const {jwtStrategy} = require('../auth');
const {User} = require('../users/models');
const {Trip} = require('./models');

const router = express.Router();

// const jsonParser = bodyParser.urlencoded({ extended: true });   // works in browser, not Postman
const jsonParser = bodyParser.json();      // works in Postman, not browser


passport.use(jwtStrategy);
const jwtAuth = passport.authenticate('jwt', { session: false });

// Get list of all trips - not something I want:

router.get('/', (req, res) => {
  console.log('req.body: ', req.body);
  console.log('req.trip: ', req.trip);
  return Trip
    .find()
    .then(trips => res.json(trips))
    .catch(
      err => {
        console.error(err);
        res.status(500).json({message: 'Something\'s wrong with the trip page.'});
    });

});

//  Get one particular trip + its list of items + its users from a User's list of trips:

router.get('/:tripId', jwtAuth, (req, res) => {
  console.log('req.user: ', req.user);
  console.log(`req.user.username: ${req.user.username}`);
  console.log('req.params.tripId: ' + req.params.tripId);


  const singleTripUUID = req.params.tripId;

  User
    .findOne({username: req.user.username})
    .populate({path: 'trip', $match: {tripUUID: singleTripUUID}})
    .exec()
    .then(user => {
      let trip = user.trip.find(trip => trip.tripUUID === singleTripUUID);
      if (trip){
        res.json(trip);
      }
      else {
        res.status(403).json({message: 'You can\'t look at that trip!'});
      }
    })
    .catch(
      err => {
        console.error(err);
        res.status(500).json({message: 'Something\'s wrong with the individual trip page.'});
    });

});

//  Create a trip and a UUID for a particular user:

router.post('/', jsonParser, jwtAuth, (req,res) => {
  const tripName = req.body.tripName;
  const tripUUID = uuidv1();
  Trip
  .create({tripUUID: tripUUID, tripName: tripName})
  .then(trip => {
    User
      .findOne({username: req.user.username})
      .then(user => {
        user.trip.push(trip);   // Mongoose handles what info is referenced
        user.save()
        .then(user => {
          trip.users.push(user);  // Mongoose handles what info is referenced
          trip.save()
          .then(trip => res.json(trip))
        })
      })
  })
  .catch(
      err => {
        console.error(err);
        res.status(500).json({message: 'Something\'s wrong with the trip post route.'});
    });
})













module.exports = {router};
