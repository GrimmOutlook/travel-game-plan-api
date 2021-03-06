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

  const singleTripId = req.params.tripId;

  User
    .findOne({username: req.user.username})
    .populate({path: 'trip', $match: {_id: singleTripId}})
    .exec()
    .then(user => {
      console.log(`user: ${user}`);
      let trip = user.trip.find(trip => trip._id == singleTripId);
       if (!trip){
        res.status(403).json({message: 'That trip does not exist!'});
      }
      else if (trip){
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
      console.log('---------trip created, pushed into users trip array---------: ', trip._id);
      return User
        .findOneAndUpdate({username: req.user.username}, {$push: {trips: trip._id}})
          .then(user => {
            return Trip
            .findOneAndUpdate({_id: trip._id}, {$push: {users: user._id}})
            .then(trip => res.json(trip))
          })
    })
    .catch(
      err => {
        console.error(err);
        res.status(500).json({message: 'Something\'s wrong with the trip post route.'});
    });
})


//  Delete a single trip:
    // Designate the creator of trip as admin?  Only that user can delete a trip?  Extra step in the trip creation endpoint.

router.delete('/:tripId', jsonParser, jwtAuth, (req, res) => {
  const singleTripId = req.params.tripId;
  const tripDeleteByUser = req.user.username;

  Trip
    .findOne({_id: singleTripId})  //always returns an array of objects with just find()
    .populate('users')
    .exec()
    .then(trip => {
      console.log(`trip: ${trip}`);
      if (!trip){
        res.status(403).json({message: 'That trip does not exist!'});
      }
      else if (trip){
        let user = trip.users.find(user => user.username === tripDeleteByUser);

          if (!user){
            res.status(403).json({message: 'You are not authorized to delete this trip!'});
          }
          else {
            return trip.remove();
          }
      }
    })
    .then(trip => {
      res.status(200).json({message: 'You have successfully deleted this trip!'});
    })
    .catch(
      err => {
        console.error(err);
        res.status(500).json({message: 'Something\'s wrong with the trip delete route.'});
    });
})

//  Edit an Existing Trip:

router.put('/:tripId', jsonParser, jwtAuth, (req,res) => {
  const singleTripId = req.params.tripId;
  const someObject = Object.assign({}, req.body)

  Trip
    .findOneAndUpdate({_id: singleTripId}, someObject, {new: true})
    .then(trip => res.json(trip))
    .catch(
      err => {
        console.error(err);
        res.status(500).json({message: 'Something\'s wrong with the trip put route.'});
    });
})

//  Creating a New item:

router.post('/:tripId', jsonParser, jwtAuth, (req,res) => {
  const singleTripId = req.params.tripId;
  const {item, itemDetails} = req.body;
  const newItemObject = {item, itemDetails};
  console.log('create new item req.user.username: ', req.user.username);

 User
    .findOne({username: req.user.username})
    .then(user => {
      if (req.body.claimOrNot){
        newItemObject.userClaim = user._id;
      }
      return Trip
        .findOneAndUpdate({_id: singleTripId}, {$push: {items: newItemObject}}, {new: true})
        .populate([
          {
            path: 'items.userClaim',
            model: 'User'
          },
          {
            path: 'users',
            model: 'User'
          }
        ])
        .exec()
    })
    .then(trip => {
      console.log(`trip in create new item api endpoint: ${trip}`);
      res.json(trip);
    })
    .catch(
      err => {
        console.error(err);
        res.status(500).json({message: 'Something\'s wrong with the item POST route.'});
    });
})

//  Editing an Existing item:

router.put('/:tripId/:itemId', jsonParser, jwtAuth, (req,res) => {
  const singleTripId = req.params.tripId;
  const singleItemId = req.params.itemId;
  let userClaimUpdate = {};

  User
    .findOne({username: req.user.username})
    .then(user => {
      if (req.body.claimOrNot){
        userClaimUpdate = {_id: user._id, username: req.user.username};
      }
      return Trip
        .findOne({_id: singleTripId})
        .populate([
          {
            path: 'items.userClaim',
            model: 'User'
          },
          {
            path: 'users',
            model: 'User'
          }
        ])
        .exec()
    })
    .then(trip => {
      trip.items.find(item => {
        if (singleItemId == item._id){
          // console.log(`item before modify: ${item}`);
          console.log(`item.userClaim before modify: ${item.userClaim}`);
          item.item = req.body.item || item.item;
          item.itemDetails = req.body.itemDetails || item.itemDetails;
          item.userClaim = userClaimUpdate || item.userClaim;
          console.log(`item.userClaim AFTER modify: ${item.userClaim}`);
          console.log(`item after modify: ${item}`);   // Do I need an else?
        }
      })
      trip.save();
      res.json(trip);   // why don't we need a .then to render the updated trip?
    })
    .catch(
      err => {
        console.error(err);
        res.status(500).json({message: 'Something\'s wrong with the item PUT route.'});
    });
})

//  Delete an Existing item:

router.delete('/:tripId/:itemId', jsonParser, jwtAuth, (req, res) => {
  console.log(`req.user.username in item DELETE: ${req.user.username}`);
  const singleTripId = req.params.tripId;
  const singleItemId = req.params.itemId;

  Trip
    .findOne({_id: singleTripId})
    .then(trip => {
      trip.items.find(item => {
        if (singleItemId == item._id){
          return item.remove();
        }
      })
      trip.save();
    })
    .then(trip => {
      console.log(`trip at the bottom of item delete: ${trip}`)
      res.status(200).json({message: 'You have successfully deleted this item!'});
    })
    .catch(
      err => {
        console.error(err);
        res.status(500).json({message: 'Something\'s wrong with the item DELETE route.'});
    });

})


//  GET the tripName & tripUUID only when sent a trip UUID from a user receiving an invitation:

router.get('/trip-invite/:tripUUID', (req, res) => {
  console.log('req.params.tripUUID: ' + req.params.tripUUID);

  const inviteTripId = req.params.tripUUID;

  Trip
    .findOne({tripUUID: inviteTripId})
    .exec()
    .then(trip => {
      console.log('trip: ', trip);
       if (!trip){
        res.status(403).json({message: 'That trip does not exist!'});
      }
      else if (trip){
        res.json({tripName: trip.tripName, tripUUID: trip.tripUUID});
      }
      else {
        res.status(403).json({message: 'You can\'t look at that trip!'});
      }
    })
    .catch(
      err => {
        console.error(err);
        res.status(500).json({message: 'Something\'s wrong with the trip-invite/:tripUUID endpoint.'});
    });

});

module.exports = {router};
