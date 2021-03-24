const express = require('express');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');

const Favorites = require('../models/favorite');

const favoriteRouter = express.Router();

favoriteRouter.use(express.json());
favoriteRouter.use(express.urlencoded({extended: false}));

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200)})

.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({user: req.user._id})
    .then((favorite) => {
        if (!favorite) {
            //the user has no favorites so we'll return an empty array
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');    
            res.json([]);
        } else {
            //we populate the document and send back to the user
            Favorites.findById(favorite._id)
            .populate(['user', 'favoriteDishes'])
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
    Favorites.findOne({"user": req.user._id})
    .then((favorite) => {
        //if the favorite document doesn't exist, we'll create one for the current user
        //and add the favorites
        if (!favorite) {
            const arr = [];
            for (let i = 0; i < req.body.length; i++) {
                arr.push(req.body[i]._id);
            }
            Favorites.create({user: req.user._id, favoriteDishes: arr}, (err, doc) => {
                if (err) return next(err);
                else {
                    res.statusCode = 200;
                    res.setHeader('Content-type', 'application/json');
                    return res.json(doc);
                }
            });
        }

        else {
            // for each dish, if it is not already in the document we should add it
            for (let i = 0; i < req.body.length; i++) {
                if (favorite.favoriteDishes.indexOf(req.body[i]._id) === -1) {
                    favorite.favoriteDishes.push(req.body[i]._id);
                }
            }

            //after we've added the favorite dishes we save the document to our database
            favorite.save()
            .then((favorite) => {
                Favorites.findById(favorite._id)
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
    .catch((err) => next(err))
})

.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.deleteOne({user: req.user._id})
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-type', 'application/json');
        return res.json(resp);
    }, (err) => next(err))
    .catch((error) => next(error))
})


favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200)})

.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('GET operation not supported on /favorites');
})

.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({"user": req.user._id})
    .then((favorite) => {
        if (!favorite) {
            Favorites.create({user: req.user._id, favoriteDishes: [req.params.dishId]}, (err, doc) => {
                if (err) return next(err);
                else {
                    res.statusCode = 200;
                    res.setHeader('Content-type', 'application/json');
                    return res.json(doc);
                }
            });
        }

        else {
            if (favorite.favoriteDishes.indexOf(req.params.dishId) === -1) {
                favorite.favoriteDishes.push(req.params.dishId);
            }
            favorite.save()
            .then((favorite) => {
                Favorites.findById(favorite._id)
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

        let dishIndex = favorite.favoriteDishes.indexOf(req.params.dishId);
        if (dishIndex !== -1) {
            favorite.favoriteDishes.splice(dishIndex, 1);
        }
        
        favorite.save()
            .then((favorite) => {
                Favorites.findById(favorite._id)
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