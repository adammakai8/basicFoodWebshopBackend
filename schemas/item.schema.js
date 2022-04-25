const mongoose = require('mongoose');

const productSchema = require('./product.schema');

var itemSchema = new mongoose.Schema({
    product: { type: productSchema, required: true },
    amount: { type: Number, required: true }
}, { collection: 'Items' });

module.exports = itemSchema;