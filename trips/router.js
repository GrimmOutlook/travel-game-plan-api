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

//  Create a new trip and a UUID for a particular user:

router.post('/', jsonParser, jwtAuth, (req,res) => {
  const tripName = req.body.tripName;
  const dateStart = req.body.dateStart;
  const dateEnd = req.body.dateEnd;
  const address = req.body.address;
  const tripDetails = req.body.tripDetails;
  const tripUUID = uuidv1();
  Trip
    .create({tripUUID: tripUUID, tripName: tripName, dateStart: dateStart, dateEnd: dateEnd, address: address, tripDetails: tripDetails})
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


//  Delete a single trip:
    //Find Trip by ID, populate Trip object with the users, if req.user === one of the populated users, then remove by ID.  If not, res.status(403).json({message: 'You can\'t delete that trip!'});

    // Designate the creator of trip as admin?  Only that user can delete a trip?  Extra step in the trip creation endpoint.

router.delete('/:tripId', jsonParser, jwtAuth, (req, res) => {
  console.log(`req.user.username: ${req.user.username}`);
  console.log('req.params.tripId: ' + req.params.tripId);

  const singleTripUUID = req.params.tripId;
  const tripDeleteByUser = req.user.username;

  // Trip.findOneAndRemove({tripUUID: singleTripUUID}).then(res.status(200).json({message: 'You have successfully deleted this trip!'});)

  Trip
    .find({tripUUID: singleTripUUID})
    .populate('users')
    .exec()
    .then(trip => {
      console.log(`trip: ${trip}`);
      console.log(`trip.tripName before if: ${trip.tripName}`);
      console.log(`trip[0].tripName before if: ${trip[0].tripName}`);
      if (!trip){
        res.status(403).json({message: 'That trip does not exist!'});
      }
      else if (trip){
        console.log(`trip[0].users[0].username in else if: ${trip[0].users[0].username}`);
        let user = trip[0].users.find(user => user.username === tripDeleteByUser);
        console.log(`user: ${user}`);
          if (!user){
            res.status(403).json({message: 'You are not authorized to delete this trip!'});
          }
          else {
            console.log(`trip[0] before empty object: ${trip[0]}`);
            trip[0] = {};
            console.log('trip[0] after empty object: ', trip[0]);
            res.status(200).json({message: 'You have successfully deleted this trip!'});
          }
      }
    })
    .then(trip => {
      console.log(`trip at the bottom: ${trip}`)
      trip.save()
    })

})

//  Edit an Existing Trip:

router.put('/:tripId', jsonParser, jwtAuth, (req,res) => {

  const singleTripUUID = req.params.tripId;

  Trip
    .findOneAndUpdate({tripUUID: singleTripUUID})
    .then(trip => {
      console.log('trip to update: ', trip);
      trip.tripName = req.body.tripName || trip.tripName;
      trip.dateStart = req.body.dateStart || trip.dateStart;
      trip.dateEnd = req.body.dateEnd || trip.dateEnd;
      trip.address = req.body.address || trip.address;
      trip.tripDetails = req.body.tripDetails || trip.tripDetails;
    })
    .then(trip => res.json(trip))
    .catch(
      err => {
        console.error(err);
        res.status(500).json({message: 'Something\'s wrong with the trip post route.'});
    });
})





module.exports = {router};
