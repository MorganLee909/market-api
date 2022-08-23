const mongoose = require("mongoose");

const email = require("../helper.js").isValidEmail;

const VendorSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        validate: {
            validator: email,
            message: "Invalid email"
        },
        index: true
    },
    password: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    items: [],
    session: {
        type: String,
        required: true
    },
    createdDate: {
        type: Date,
        required: true,
        default: new Date()
    }
});

module.exports = mongoose.model("vendor", VendorSchema);