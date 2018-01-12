'use strict';
const express = require('express');
const bodyParser = require('body-parser');

const {Trip} = require('./models');

const router = express.Router();

const jsonParser = bodyParser.urlencoded({ extended: true });   // works in browser, not Postman
// const jsonParser = bodyParser.json();      // works in Postman, not browser

router.get('/', jsonParser, (req, res) => {
  console.log('req.body', req.body);
  console.log('req.user.username', req.user.username);
  Trip
    .findOne({username: req.user.username})
    .then(user => {
      console.log("user: ", user);
      res.render('trip', user.apiRepr());
    })
    .catch(
      err => {
        console.error(err);
        res.status(500).json({message: 'Something\'s wrong with the trip page.'});
    });

});

module.exports = {router};
