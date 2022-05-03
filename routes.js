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
                if (request.body.email === process.env.ADMIN_EMAIL) {
                    request.session.admin = true;
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
        request.session.admin = undefined;
        return response.status(200).send({message: 'Logout successful'});
    } else {
        return response.status(403).send({error: 'FORBIDDEN', detail: 'No user was logged in'});
    }
});

router.route('/register').put((request, response) => {
    if (!request.body.name || !request.body.birthdate || !request.body.password || !request.body.email) {
        return response.status(400).send({error: 'BAD_REQUEST', detail: 'Missing user data'});
    } else {
        userModel.findOne({ email: request.body.email }, (error, user) => {
            if (error) {
                return response.status(500).send({error: 'INTERNAL_SERVER_ERROR', detail: error});
            }
            if (user) {
                return response.status(400).send({error: 'BAD_REQUEST', detail: 'Email already in use'});
            }
            const newUser = new userModel({
                name: request.body.name,
                birthdate: request.body.birthdate,
                password: request.body.password,
                email: request.body.email,
            });
            newUser.save(saveError => {
                if (saveError) {
                    return response.status(500).send({error: 'INTERNAL_SERVER_ERROR', detail: saveError});
                }
                return response.status(200).send(request.body);
             });
        });
    }
});

router.route('/products').get((request, response) => {
    if (!request.isAuthenticated()) {
        return response.status(403).send({error: 'FORBIDDEN', detail: 'Not authenticated'});
    }
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
            return response.status(500).send({error: 'INTERNAL_SERVER_ERROR', detail: error});
        }
        return response.status(200).send(products);
    });
}).put((request, response) => {
    if (!request.body.name || !request.body.category || !request.body.price) {
        return response.status(400).send('Bad request, missing required parameters!');
    }
    if (!request.isAuthenticated() || !request.session.admin) {
        return response.status(403).send('Access denied');
    }
    const newProduct = new productModel({
        name: request.body.name,
        category: request.body.category,
        description: request.body.description,
        tags: request.body.tags,
        price: request.body.price
    });
    newProduct.save(saveError => {
        if (saveError) {
            return response.status(500).send(saveError);
        }
        return response.status(200).send(newProduct);
    });
});

router.route('/buy').put((request, response) => {
    if (!request.isAuthenticated()) {
        return response.status(403).send({error: 'FORBIDDEN', detail: 'Not authenticated'});
    }
    if (!request.body.item) {
        return response.status(400).send({error: 'BAD_REQUEST', detail: 'Missing item parameter'});
    }
    if (!request.session.basket) {
        request.session.basket = [];
    }
    request.session.basket.push(request.body.item);
    return response.status(200).send(request.body.item);
}).post((request, response) => {
    if (!request.isAuthenticated()) {
        return response.status(403).send({error: 'FORBIDDEN', detail: 'Not authenticated'});
    }
    if (!request.body.item) {
        return response.status(400).send({error: 'BAD_REQUEST', detail: 'Missing item parameter'});
    }
    if (!request.session.basket || request.session.basket.length === 0) {
        return response.status(400).send({error: 'BAD_REQUEST', detail: 'Basket is missing or empty'});
    }
    const index = request.session.basket.findIndex(item => item._id === request.body.item._id);
    request.session.basket[index].amount = request.body.item.amount;
    return response.status(200).send(request.session.basket);
}).delete((request, response) => {
    if (!request.isAuthenticated()) {
        return response.status(403).send({error: 'FORBIDDEN', detail: 'Not authenticated'});
    }
    if (!request.body.item) {
        return response.status(400).send({error: 'BAD_REQUEST', detail: 'Missing item parameter'});
    }
    if (!request.session.basket || request.session.basket.length === 0) {
        return response.status(400).send({error: 'BAD_REQUEST', detail: 'Basket is missing or empty'});
    }
    const index = request.session.basket.findIndex(item => item._id === request.body.item._id);
    request.session.basket.splice(index, 1);
    return response.status(200).send(request.session.basket);
});

router.route('/basket').get((request, response) => {
    if (!request.isAuthenticated()) {
        return response.status(403).send({error: 'FORBIDDEN', detail: 'Not authenticated'});
    }
    if (!request.session.basket) {
        request.session.basket = [];
    }
    return response.status(200).send(request.session.basket);
});

router.route('/order').post((request, response) => {
    if (!request.isAuthenticated()) {
        return response.status(403).send({error: 'FORBIDDEN', detail: 'Not authenticated'});
    }
    if (!request.body.order) {
        return response.status(400).send({error: 'BAD_REQUEST', detail: 'Missing order parameter'});
    }
    const newOrder = new orderModel(request.body.order);
    newOrder.save(error => {
        if (error) {
            return response.status(500).send({error: 'INTERNAL_SERVER_ERROR', detail: 'Database error: ' + error});
        } 
        request.session.basket = [];
        return response.status(200).send(request.body.order);
    });
});

module.exports = router;
