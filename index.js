const express = require('express');
const mongoose = require('mongoose');
const app = express();

const session = require('express-session');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;

const dbUrl = 'mongodb+srv://admin:WKswhAdsyqbIcSaX@cluster0.xo8r8.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
mongoose.connect(dbUrl);

mongoose.connection.on('connected', () => { console.log('Database connected') });
mongoose.connection.on('error', (error) => { console.log('Database connection error', error) });

mongoose.model('User', require('./schemas/user.schema'));
mongoose.model('Product', require('./schemas/product.schema'));
mongoose.model('Item', require('./schemas/item.schema'));
mongoose.model('Order', require('./schemas/order.schema'));

app.use(express.json())
app.use(express.urlencoded({
    extended: true
}));

passport.use('local', new localStrategy({usernameField: 'email'}, (email, password, done) => {
    const userModel = mongoose.model('User');
    userModel.findOne({ email: email }, (error, user) => {
        if (error) {
            return done('Error in query', null);
        }
        if (!user) {
            return done('No user found with this email', null);
        }
        user.comparePasswords(password, (loginError, isMatch) => {
            if (loginError) {
                return done(loginError, false);
            }
            if (!isMatch) {
                return done('Incorrect password', false);
            }
            return done(null, user);
        });
    });
}));

passport.serializeUser((user, done) => {
    if (!user) {
        return done('No user to log in', null);
    }
    return done(null, user);
});

passport.deserializeUser(function (user, done) {
    if (!user) {
        return done("No user to log out", null);
    }
    return done(null, user);
});

app.use(session({ secret: 'fwkuEVefw43refFUV3Ucwbuozg32zufwevsuzfw3b', resave: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', require('./routes'));

app.listen(3001, () => {
    console.log('Server started');
});