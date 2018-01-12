'use strict';
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

const TripSchema = Schema({
  tripUUID: String,
  users:[{
    type: Schema.Types.ObjectId, ref: 'User'
  }],
  tripName: String,
  dateStart: {type: Date, default: Date.now},
  dateEnd: Date,
  address: String,
  tripDetails: String,
  items: [
    {
      item: String,
      itemDetails: String,
      userClaim: {type: Schema.Types.ObjectId, ref: 'User'}
    }
  ]
});


const Trip = mongoose.model('Trip', TripSchema);

module.exports = {Trip};
