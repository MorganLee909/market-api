const Vendor = require("../models/vendor.js");

const helper = require("../helper.js");
const bcrypt = require("bcryptjs");
const axios = require("axios");

module.exports = {
    /*
    POST: create a new vendor
    req.body = {
        name: String, required
        email: email, required
        password: String, required
        confirmPass: String, required
        description: String, optional
        address: String, optional
    }
    */
    create: function(req, res){
        if(req.body.password !== req.body.confirmPass) return res.json("Passwords do not match");
        if(req.body.password.length < 10) return res.json("Password must contain at least 10 characters");
        let email = req.body.email.toLowerCase();

        Vendor.findOne({email: email})
            .then((vendor)=>{
                if(vendor !== null) throw "email";

                if(req.body.address){
                    const apiUrl = "https://api.geocod.io/v1.6/geocode";
                    const address = req.body.address;
                    const fullUrl = `${apiUrl}?q=${address}&api_key=${process.env.MARKET_GEOENCODE_KEY}&limit=1`;
                    return axios({
                        method: "get",
                        url: fullUrl
                    });
                }else{
                    return null;
                }
            })
            .then((geoData)=>{
                let salt = bcrypt.genSaltSync(10);
                let hash = bcrypt.hashSync(req.body.password, salt);

                let newVendor = new Vendor({
                    name: req.body.name,
                    email: email,
                    password: hash,
                    description: req.body.description,
                    session: helper.generateSession(25),
                    items: []
                });

                if(geoData !== null){
                    let result = geoData.data.results[0];
                    let lat = result.location.lat;
                    let lng = result.location.lng;
                    let comps = result.address_components;

                    newVendor.address = {
                        streetNumber: comps.number,
                        road: comps.formatted_street,
                        city: comps.city,
                        county: comps.county,
                        state: comps.state,
                        country: comps.country,
                        zipCode: comps.zip,
                        full: result.formatted_address
                    };

                    newVendor.location = {
                        type: "Point",
                        coordinates: [lat, lng]
                    };
                }

                return newVendor.save();
            })
            .then((vendor)=>{
                req.session.vendor = vendor.session;
                
                vendor.password = undefined;
                vendor.session = undefined;

                return res.json(vendor);
            })
            .catch((err)=>{
                switch(err){
                    case "email": return res.json("User with this email already exists");
                    default:
                        console.error(err);
                        return res.json("ERROR: unable to create new vendor");
                }
            });
    },

    /*
    POST: update vendor data
    req.body = {
        vendor: vendor Id, required
        name: String, optional
        email: String, optional,
        description: String, optional
        address: String, optional
    }
    */
    update: function(req, res){
        Vendor.findOne({_id: req.body.vendor})
            .then(async (vendor)=>{
                if(vendor === null) throw "vendor";
                if(vendor.session !== req.session.vendor) throw "session";

                if(req.body.name) vendor.name = req.body.name;
                if(req.body.email) vendor.email = req.body.email;
                if(req.body.description) vendor.description = req.body.description;

                if(req.body.address){
                    const apiUrl = "https://api.geocod.io/v1.6/geocode";
                    const address = req.body.address;
                    const fullUrl = `${apiUrl}?q=${address}&api_key=${process.env.MARKET_GEOENCODE_KEY}&limit=1`;
                    let geoData = await axios({
                        method: "get",
                        url: fullUrl
                    });
                    let result = geoData.data.results[0];
                    let lat = result.location.lat;
                    let lng = result.location.lng;
                    let comps = result.address_components;

                    vendor.address = {
                        streetNumber: comps.number,
                        road: comps.formatted_street,
                        city: comps.city,
                        county: comps.county,
                        state: comps.state,
                        country: comps.country,
                        zipCode: comps.zip,
                        full: result.formatted_address
                    };

                    vendor.location = {
                        type: "Point",
                        coordinates: [lat, lng]
                    };
                }

                return vendor.save();
            })
            .then((vendor)=>{
                vendor.password = undefined;
                vendor.session = undefined;

                return res.json(vendor);
            })
            .catch((err)=>{
                switch(err){
                    case "vendor": return res.json("This vendor does not exist");
                    case "session": return res.json("Permission denied");
                    default:
                        console.error(err);
                        return res.json("ERROR: unable to update vendor");
                }
            });
    },

    /*
    POST: vendor login route
    req.body = {
        email: email, required
        password: String, required
    }
    */
    login: function(req, res){
        let email = req.body.email.toLowerCase();

        let v = {};
        Vendor.findOne({email: email})
            .then((vendor)=>{
                if(vendor === null) throw "email";
                v = vendor;

                return bcrypt.compare(req.body.password, vendor.password);
            })
            .then((result)=>{
                if(!result) throw "password";

                req.session.vendor = v.session;

                v.password = undefined;
                v.session = undefined;

                return res.json(v);
            })
            .catch((err)=>{
                switch(err){
                    case "email": return res.json("User with this email doesn't exist");
                    case "password": return res.json("Incorrect password");
                    default:
                        console.error(err);
                        return res.json("ERROR: unable to login user");
                }
            });
    },

    logout: function(req, res){
        req.session.vendor = null;

        return res.json({});
    },

    /*
    GET: retrieve data from a single vendor
    Data may be different if logged in vendor
    req.params.id = Vendor id
    response = Vendor
    */
    retrieve: function(req, res){
        console.log("retrieve");
        Vendor.findOne({_id: req.params.id})
            .then((vendor)=>{
                let responseVendor = vendor.toObject();
                responseVendor.password = undefined;
                responseVendor.session = undefined;
                responseVendor.createdDate = undefined;
                responseVendor.loggedIn = vendor.session === req.session.vendor;

                console.log(responseVendor);
                return res.json(responseVendor);
            })
            .catch((err)=>{
                console.error(err);
                return res.json("ERROR: unable to retrieve vendor data");
            });
    }
}