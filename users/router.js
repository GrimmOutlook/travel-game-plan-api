'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const config = require('../config');

const {jwtStrategy} = require('../auth');
const {User} = require('./models');
const {Trip} = require('../trips/models');

const router = express.Router();

// const jsonParser = bodyParser.urlencoded({ extended: true });   // works in browser, not Postman
const jsonParser = bodyParser.json();      // works in Postman, not browser

// Post to register a new user
router.post('/', jsonParser, (req, res) => {
  console.log('req.body', req.body);
  const requiredFields = ['username', 'password'];
  const missingField = requiredFields.find(field => !(field in req.body));

  if (missingField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Missing field',
      location: missingField
    });
  }

  const stringFields = ['username', 'password', 'firstName', 'lastName'];
  const nonStringField = stringFields.find(
    field => field in req.body && typeof req.body[field] !== 'string'
  );

  if (nonStringField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Incorrect field type: expected string',
      location: nonStringField
    });
  }

  const explicityTrimmedFields = ['username', 'password'];
  const nonTrimmedField = explicityTrimmedFields.find(
    field => req.body[field].trim() !== req.body[field]
  );

  if (nonTrimmedField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Cannot start or end with whitespace',
      location: nonTrimmedField
    });
  }

  const sizedFields = {
    username: {
      min: 1
    },
    password: {
      min: 10,
      // bcrypt truncates after 72 characters, so let's not give the illusion
      // of security by storing extra (unused) info
      max: 72
    }
  };
  const tooSmallField = Object.keys(sizedFields).find(
    field =>
      'min' in sizedFields[field] &&
            req.body[field].trim().length < sizedFields[field].min
  );
  const tooLargeField = Object.keys(sizedFields).find(
    field =>
      'max' in sizedFields[field] &&
            req.body[field].trim().length > sizedFields[field].max
  );

  if (tooSmallField || tooLargeField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: tooSmallField
        ? `Must be at least ${sizedFields[tooSmallField]
          .min} characters long`
        : `Must be at most ${sizedFields[tooLargeField]
          .max} characters long`,
      location: tooSmallField || tooLargeField
    });
  }

  let {username, password, firstName = '', lastName = ''} = req.body;
  // Username and password come in pre-trimmed, otherwise we throw an error
  // before this
  firstName = firstName.trim();
  lastName = lastName.trim();

  return User.find({username})
    .count()
    .then(count => {
      if (count > 0) {
        // There is an existing user with the same username
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'Username already taken',
          location: 'username'
        });
      }
      // If there is no existing user, hash the password
      return User.hashPassword(password);
    })
    .then(hash => {
      return User.create({
        username,
        password: hash,
        firstName,
        lastName
      });
    })
    .then(user => {
      return res.status(201).json(user.apiRepr());
    })
    .catch(err => {
      // Forward validation errors on to the client, otherwise give a 500
      // error because something unexpected has happened
      if (err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      }
      res.status(500).json({code: 500, message: 'Internal server error'});
    });
});

passport.use(jwtStrategy);
const jwtAuth = passport.authenticate('jwt', { session: false });


//  Use this for endpoint for retrieving all trips for a given user (dashboard):

router.get('/me', jwtAuth, (req, res) => {
  console.log('Date.now(): ', Date.now());
  User
    .findOne({username: req.user.username})
    .populate(
      {
        path: 'trips',
        model: 'Trip',
        match: {
          dateEnd: {
            '$gte': Date.now()          //1518971708780
          }
        },
        options: {
          sort: {
            dateStart: 1
          }
        },
        populate: [
          {
            path: 'items.userClaim',
            model: 'User'
          },
          {
            path: 'users',
            model: 'User'
          }
        ]
      }
    )
    .exec()
    .then(user => res.json(user))
    .catch(err => res.status(500).json({message: 'Internal server error'}));
});

// Add trip to user's trip array after receiving trip-invite:

router.put('/me', jsonParser, jwtAuth, (req, res) => {
  const tripInviteUUID = req.body.inviteUUID;

  User
    .findOne({username: req.user.username})
    .populate('trips')
    .then(user => {
      return Trip
        .findOne({tripUUID: tripInviteUUID})
        .populate('users')
        .exec()
        .then(trip => {
          console.log('PUT /me trip after findOne: ', trip);
          user.trips.concat([trip]);
          user.save()
          .then(user => {
            trip.users.concat([user]);  // Mongoose handles what info is referenced
            trip.save()
            .then(trip => res.json(trip))
          })
        })
    })
    .catch(
      err => {
        console.error(err);
        res.status(500).json({message: 'Something\'s wrong with the add a trip feature.'});
    });
})

module.exports = {router};
