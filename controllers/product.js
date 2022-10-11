const {Product} = require("../models/product.js");

module.exports = {
    /*
    POST: create a new product for a vendor
    req.body = {
        products: [{
            name: String, required
            unit: String, optional
            quantity: Number, optional
        }]
    }
    */
    create: function(req, res){
        let newProducts = [];
        for(let i = 0; i < req.body.products.length; i++){
            let product = new Product({
                name: req.body.products[i].name,
                unit: req.body.products[i].unit,
                quantity: req.body.products[i].quantity
            });

            res.locals.vendor.products.push(product);
            newProducts.push(product);
        }

        res.locals.vendor.save()
            .then((vendor)=>{
                return res.json(newProducts);
            })
            .catch((err)=>{
                console.error(err);
                return res.json("ERROR: unable to create new products");
            });
    }
}