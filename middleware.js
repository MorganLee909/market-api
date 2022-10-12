const Vendor = require("./models/vendor.js");

const jwt = require("jsonwebtoken");

module.exports = {
    vendorAuth: function(req, res, next){
        let authData = {};        
        try{
            authData = jwt.verify(req.headers["authorization"].split(" ")[1], process.env.JWT_SECRET);
        }catch(e){
            return res.json("Web token not provided");
        }

        Vendor.findOne({_id: authData._id})
            .then((vendor)=>{
                res.locals.vendor = vendor;
                next();
            })
            .catch((err)=>{
                console.error(err);
                return res.json("ERROR: unable to authenticate user.");
            });
    }
}