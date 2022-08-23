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
    address: {
        streetNumber: String,
        road: String,
        city: String,
        county: String,
        state: String,
        country: String,
        zipCode: String,
        full: String
    },
    location: {
        type: {type: String},
        coordinates: [],
        required: false
    },
    createdDate: {
        type: Date,
        required: true,
        default: new Date()
    }
});

VendorSchema.index({location: "2dsphere"});

module.exports = mongoose.model("vendor", VendorSchema);