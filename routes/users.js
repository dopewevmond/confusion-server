var express = require('express');
var User = require('../models/user');
var passport = require('passport');
var authenticate = require('../authenticate');
var cors = require('./cors');

var router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: false }));

/* GET users listing. */
router.get('/', cors.cors,  authenticate.verifyUser, authenticate.verifyAdmin, function(req, res, next) {
  User.find({})
  .then((users) => {
    res.statusCode = 200;
    res.setHeader('Content-type', 'application/json');
    res.json(users);
  }, (err) => next(err))
  .catch((error) => next(error))
});

router.post('/signup', cors.corsWithOptions,  function(req, res, next){
  User.register(new User({ username: req.body.username }), req.body.password, (err, user) => {
    if (err) {
      res.statusCode = 500;
      res.setHeader('Content-type', 'application/json');
      res.json({err});
    } else {
      if (req.body.firstname) 
        user.firstname = req.body.firstname
      if (req.body.lastname) 
        user.lastname = req.body.lastname
      user.save((err, user) => {
        if (err) {
          res.statusCode = 500;
          res.setHeader('Content-type', 'application/json');
          res.json({err});
          return
        }

        passport.authenticate('local')(req, res, () => {
          res.statusCode = 200;
          res.setHeader('Content-type', 'application/json');
          res.json({ success: true, status: 'registration successful' });
        });
      });
    }
  })
});


router.post('/login', cors.corsWithOptions,  passport.authenticate('local'), (req, res) => {
  var token = authenticate.getToken({ _id: req.user._id })
  res.statusCode = 200;
  res.setHeader('Content-type', 'application/json');
  res.json({ success: true, token, status: 'you are successfully logged in' });
});

router.get('/logout', cors.cors,  (req, res, next) => {
  if (req.session) {
    req.session.destroy();
    res.clearCookie('session-id');
    res.redirect('/');
  } 
  else {
    var err = new Error('You are not logged in');
    err.status = 403;
    next(err);
  }
});

router.get('/facebook/token', passport.authenticate('facebook-token'), (req, res) => {
  //if the request is successful after passing through the passport.authenticate middleware,
  //it will have loaded the user property onto the request object 
  if(req.user) {
    var token = authenticate.getToken({ _id: req.user._id});
    res.statusCode = 200;
    res.setHeader('Content-type', 'application/json');
    res.json({ success: true, token, status: 'you are successfully logged in' });
  }
});

module.exports = router;
