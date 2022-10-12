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
    response = [Product]
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
    },

    /*
    DELETE: remove products from a vendor
    req.body = {
        products: [Product id]
    }
    response = {}
    */
    remove: function(req, res){
        for(let i = 0; i < req.body.products.length; i++){
            for(let j = 0; j < res.locals.vendor.products.length; j++){
                if(req.body.products[i] === res.locals.vendor.products[j]._id.toString()){
                    res.locals.vendor.products.splice(j, 1);
                    break;
                }
            }
        }

        res.locals.vendor.save()
            .then((vendor)=>{
                return res.json({});
            })
            .catch((err)=>{
                console.error(err);
                return res.json("ERROR: unable to remove products from vendor");
            });
    }
}