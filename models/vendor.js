const mongoose = require("mongoose");

const email = require("../validation.js").isValidEmail;

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
    url: {
        type: String,
        required: true,
        index: true
    },
    password: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    items: [],
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
    },
    publicData: {
        streetNumber: Boolean,
        road: Boolean,
        city: Boolean,
        county: Boolean,
        state: Boolean,
        email: Boolean,
        searchable: Boolean
    }
});

VendorSchema.index({location: "2dsphere"});

module.exports = mongoose.model("vendor", VendorSchema);