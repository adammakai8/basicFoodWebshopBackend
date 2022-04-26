const router = require('express').Router();
const mongoose = require('mongoose');

const userModel = mongoose.model('User');
const productModel = mongoose.model('Product');
const orderModel = mongoose.model('Order');

const passport = require('passport');

router.route('/login').post((request, response, next) => {
    console.log(request.body);
    if (!!request.body.email && request.body.password) {
        passport.authenticate('local', (error, user) => {
            if (error) {
                return response.status(500).send(error);
            }
            request.logIn(user, loginError => {
                if (loginError) {
                    return response.status(500).send(loginError);
                }
                return response.status(200).send(user);
            });
        }) (request, response, next);
    } else {
        return response.status(400).send({error: 'BAD_REQUEST', detail: 'Bad request, missing email or password'});
    }
});

router.route('/logout').post((request, response, next) => {
    if (request.isAuthenticated()) {
        request.logout();
        return response.status(200).send('Logout successful');
    } else {
        return response.status(403).send('No user was logged in');
    }
});

router.route('/register').put((request, response) => {
    if (!request.body.name || !request.body.birthdate || !request.body.password || !request.body.email) {
        return response.status(400).send('Missing user data');
    } else {
        userModel.findOne({ email: request.body.email }, (error, user) => {
            if (error) {
                return response.status(500).send('Database error' + error);
            }
            if (user) {
                return response.status(400).send('Email already in use');
            }
            const newUser = new userModel({
                name: request.body.name,
                birthdate: request.body.birthdate,
                password: request.body.password,
                email: request.body.email,
            });
            newUser.save(saveError => {
                if (saveError) {
                    return response.status(500).send('Database error: ' + saveError);
                }
                return response.status(200).send(request.body);
             });
        });
    }
});

router.route('/products').get((request, response) => {
    const filterParams = {};
    if (request.params.name) {
        filterParams.name = { $regex: '.*' + request.params.name + '.*' };
    }
    if (request.params.categories) {
        const array = request.params.categories.split(',');
        filterParams.category = { $all: array };
    }
    if (request.params.min_price || request.params.max_price) {
        filterParams.price = {};
        if (request.params.min_price) {
            filterParams.price.$gte = request.params.min_price;
        }
        if (request.params.max_price) {
            filterParams.price.$lte = request.params.max_price;
        }
    }
    if (request.params.tags) {
        const array = request.params.tags.split(',');
        filterParams.tags = { $all: array };
    }
    productModel.find(filterParams, (error, products) => {
        if (error) {
            return response.status(500).send('Database error: ' + error);
        }
        return response.status(200).send(products);
    });
});

router.route('/buy').post((request, response) => {
    if (!request.body.item) {
        return response.status(400).send({error: 'BAD_REQUEST', detail: 'Missing item parameter'});
    }
    if (!request.session.basket) {
        request.session.basket = [];
    }
    request.session.basket.push(request.body.item);
    return response.status(200).send(request.body.item);
});

router.route('/basket').get((request, response) => {
    if (!request.session.basket) {
        request.session.basket = [];
    }
    return response.status(200).send(request.session.basket);
});

router.route('/order').post((request, response) => {
    if (!request.body.order) {
        return response.status(400).send({error: 'BAD_REQUEST', detail: 'Missing order parameter'});
    }
    const newOrder = new orderModel(request.body.order);
    newOrder.save(error => {
        if (error) {
            return response.status(500).send({error: 'INTERNAL_SERVER_ERROR', detail: 'Database error: ' + error});
        } 
        return response.status(200).send(request.body.order);
    });
});

module.exports = router;
