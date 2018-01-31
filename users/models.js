'use strict';
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

const UserSchema = Schema({
  username: {type: String, trim: true},   // required: true, unique: true???
  password: String,    // required: true??
  firstName: {type: String, default: '', trim: true},
  lastName: {type: String, default: '', trim: true},
  trip: [{
    type: Schema.Types.ObjectId, ref: 'Trip'
  }]
});

UserSchema.methods.apiRepr = function() {
  return {
    username: this.username || '',
    firstName: this.firstName || '',
    lastName: this.lastName || '',
    trip: this.trip
  };
};

UserSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

UserSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 10);
};

const User = mongoose.model('User', UserSchema);

module.exports = {User};
