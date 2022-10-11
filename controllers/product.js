const {Product} = require("../models/product.js");

module.exports = {
    /*
    POST: create a new product for a vendor
    req.body = {
        token: JSON web token, required
        name: String, required
        unit: String, optional
        quantity: Number, optional
    }
    */
    create: function(req, res){
        console.log("creating");
    }
}