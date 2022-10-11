const mongoose = require("mongoose");

const ProductSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    unit: String,
    quantity: Number
});

module.exports = {
    Product: mongoose.model("product", ProductSchema),
    ProductSchema: ProductSchema
};