const mongoose = require('mongoose');

const itemSchema = require('./item.schema');

var orderSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    items: { type: [itemSchema], required: true },
    shippers: { type: String, required: true },
    address: { type: String, required: true },
    payment: { type: String, required: true }
}, { collection: 'Orders' });

module.exports = orderSchema;
