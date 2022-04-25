const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

var userSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true },
    birthdate: { type: Date, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true }
}, { collection: 'Users' });

userSchema.pre('save', function (next) {
    const user = this;
    if (user.isModified('password')) {
        bcrypt.genSalt(10, function (error, salt) {
            if (error) {
                return next('Error creating salt');
            }
            bcrypt.hash(user.password, salt, function (hashError, hash) {
                if (hashError) {
                    return next('Error creating hash');
                }
                user.password = hash;
                return next();
            });
        });
    } else {
        return next();
    }
});

userSchema.methods.comparePasswords = function (password, nx) {
    bcrypt.compare(password, this.password, function (err, isMatch) {
        nx(err, isMatch);
    });
};

module.exports = userSchema;
