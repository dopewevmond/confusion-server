const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');

const Favorites = require('../models/favorite');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200)})

.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({user: req.user._id})
    .then((favorite) => {
        if (!favorite) {
            //the user has no favorites so we'll return an empty array
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');    
            res.json({dishes: []});
        } else {
            //we populate the document and send back to the user
            Favorites.findById(favorite._id)
            .populate(['user', 'dishes'])
            .then((favorite) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite)
            })
            .catch((err) => next(err))
        }
    }, (err) => next(err))
})

.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})

.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
			.then((favorite) => {
				// if no favorites currently exist for this user...
				if (!favorite) {
					//create a new document and add the dishes in the request body
					Favorites.create({ user: req.user._id, dishes: req.body }, (err, doc) => {
						if (err) {
							return next(err);
						} else {
							console.log('Document inserted');
							res.statusCode = 200;
							res.setHeader('Content-Type', 'application/json');
							return res.json(doc);
						}
					});
				} else {
					//there is already a populated favorites document for this user
					//add each dish to favorites that is not already in the favorites array
					for (i = 0; i < req.body.length; i++) {
						if (favorite.dishes.indexOf(req.body[i]._id) < 0) {
							favorite.dishes.push(req.body[i]);
						}
					}
					favorite
						.save()
						.then((favorite) => {
							Favorites.findById(favorite._id)
								.populate('user')
								.populate('dishes')
								.then((favorite) => {
									res.statusCode = 200;
									res.setHeader('Content-Type', 'application/json');
									res.json(favorite);
								});
						})
						.catch((err) => {
							return next(err);
						});
				}
			})
			.catch((err) => {
				return next(err);
			});
})


favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200)})

.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({user: req.user._id})
    .populate('user')
    .populate('dishes')
    .then((favorites) => {
        if(!favorites) {
            res.statusCode = 200;
            res.setHeader('Content-type', 'application/json');
            return res.json({"exists": false, "favorites": favorites});
        } else {
            if (favorites.dishes.indexOf(req.params.dishId) === -1) {
                res.statusCode = 200;
                res.setHeader('Content-type', 'application/json');
                return res.json({exists: false, favorites});
            } else {
                res.statusCode = 200;
                res.setHeader('Content-type', 'application/json');
                return res.json({exists: true, favorites});
            }
        }
    }, (err) => next(err))
    .catch((error) => next(error))
})

.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({"user": req.user._id})
    .populate('user')
    .populate('dishes')
    .then((favorite) => {
        if (!favorite) {
            Favorites.create({user: req.user._id, dishes: [req.params.dishId]}, (err, doc) => {
                if (err) return next(err);
                else {
                    res.statusCode = 200;
                    res.setHeader('Content-type', 'application/json');
                    return res.json(doc);
                }
            });
        }

        else {
            if (favorite.dishes.indexOf(req.params.dishId) === -1) {
                favorite.dishes.push(req.params.dishId);
            }
            favorite.save()
            .then((favorite) => {
                Favorites.findById(favorite._id)
                .populate('user')
                .populate('dishes')
                .then((favorite) => {
                    res.statusCode = 200;
                    res.setHeader('Content-type', 'application/json');
                    return res.json(favorite);
                }, (err) => next(err))
                .catch((err) => next(err))

            }, (err) => next(err))
            .catch((err) => next(err))
        }
    }, (err) => next(err))
    .catch((error) => next(error))
})

.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites/' + req.params.dishId);
})

.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({"user": req.user._id})
    .then((favorite) => {
        if(!favorite) {
            err = new Error(`Dish ${req.params.dishId} not found`);
            err.status = 404;
            return next(err);
        }

        let dishIndex = favorite.dishes.indexOf(req.params.dishId);
        if (dishIndex !== -1) {
            favorite.dishes.pull(req.params.dishId);
        }
        
        favorite.save()
            .then((favorite) => {
                Favorites.findById(favorite._id)
                .populate('user')
                .populate('dishes')
                .then((favorite) => {
                    res.statusCode = 200;
                    res.setHeader('Content-type', 'application/json');
                    return res.json(favorite);
                }, (err) => next(err))
                .catch((err) => next(err))

        }, (err) => next(err))
    }, (err) => next(err))
    .catch((error) => next(error))
})

module.exports = favoriteRouter;