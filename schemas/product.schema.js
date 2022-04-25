const mongoose = require('mongoose');

var productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String },
    tags: { type: [String] },
    price: { type: Number, required: true }
}, { collection: 'Products' });

module.exports = productSchema;