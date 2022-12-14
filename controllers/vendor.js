const Vendor = require("../models/vendor.js");
const {Product} = require("../models/product.js");

const helper = require("../helper.js");
const bcrypt = require("bcryptjs");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const sharp = require("sharp");
const fs = require("fs");

module.exports = {
    /*
    GET: search for all vendors in a certain radius
    req.params = {
        address: address to search at
        distance: distance in miles to search
    }
    */
    search: function(req, res){
        const apiUrl = "https://api.geocod.io/v1.6/geocode";
        const address = req.query.address;
        const fullUrl = `${apiUrl}?q=${address}&api_key=${process.env.MARKET_GEOENCODE_KEY}&limit=1`;

        let fullAddress = "";
        axios.get(fullUrl)
            .then((response)=>{
                if(response.data.results.length === 0) throw "noAddress";
                const location = [response.data.results[0].location.lng, response.data.results[0].location.lat];
                const distance = parseFloat(req.query.distance);
                fullAddress = response.data.results[0].formatted_address;

                return Vendor.aggregate([
                    {$geoNear: {
                        near: {
                            type: "Point",
                            coordinates: location
                        },
                        distanceField: "distance",
                        maxDistance: distance
                    }},
                    {$match: {"publicData.searchable": true}},
                    {$project: {
                        name: 1,
                        description: 1,
                        items: 1,
                        address: 1,
                        email: 1,
                        distance: 1,
                        publicData: 1,
                        url: 1
                    }}
                ]);
            })
            .then((vendors)=>{
                for(let i = 0; i < vendors.length; i++){
                    helper.removeHiddenVendorData(vendors[i]);
                }

                return res.json({
                    vendors: vendors,
                    address: fullAddress
                });
            })
            .catch((err)=>{
                if(err.response?.data?.error === "Could not geocode address. Postal code or city required."){
                    return res.json("Invalid address, please try another address");
                }else if(err === "noAddress"){
                    return res.json("Could not find your location, please try another");
                }else{
                    console.error(err);
                    return res.json("ERROR: unable to complete search");
                }
            });
    },

    /*
    POST: create a new vendor
    req.body = {
        name: String, required
        email: email, required
        url: String, optional
        password: String, required
        confirmPass: String, required
        description: String, optional
        address: String, optional
    }
    response = {
        vendor: Vendor
        jwt: JSON web token
    }
    */
    create: async function(req, res){
        if(req.body.password !== req.body.confirmPass) return res.json("Passwords do not match");
        if(req.body.password.length < 10) return res.json("Password must contain at least 10 characters");

        let url = ""
        if(req.body.url){
            url = req.body.url.toLowerCase();
            let urlCheck = await helper.checkUrl(url);
            if(urlCheck === "exists") return res.json("URL already taken, please choose another.");
            if(urlCheck === "chars") return res.json("URL may only contain letters, numbers or '-'");
            if(urlCheck === "error") return res.json("ERROR: unable to validate url");
        }

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
                    products: [],
                    photos: [],
                    hours: {
                        sunday: {open: null, close: null},
                        monday: {open: null, close: null},
                        tuesday: {open: null, close: null},
                        wednesday: {open: null, close: null},
                        thursday: {open: null, close: null},
                        friday: {open: null, close: null},
                        saturday: {open: null, close: null},
                    },
                    style: {
                        mainColor: "#342628",
                        secondaryColor: "#788402",
                        textColor: "#f7f4ef"
                    },
                    publicData: {
                        streetNumber: false,
                        road: false,
                        city: false,
                        county: false,
                        state: false,
                        email: false,
                        searchable: false
                    }
                });

                newVendor.url = url ? url : newVendor._id.toString();

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

                    newVendor.publicData.searchable = true;

                    newVendor.location = {
                        type: "Point",
                        coordinates: [lng, lat]
                    };
                }

                return newVendor.save();
            })
            .then((vendor)=>{
                let token = jwt.sign({
                    _id: vendor._id.toString(),
                    email: vendor.email,
                    passHash: vendor.password
                }, process.env.JWT_SECRET);
                
                vendor.password = undefined;

                return res.json({
                    vendor: vendor,
                    jwt: token
                });
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
    POST: vendor data
    req.body = {
        vendor: vendor Id, required
        name: String, optional,
        url: String, optional
        email: String, optional,
        description: String, optional
        address: String, optional
        hours: {
            always: Boolean
            ...daysOfWeek: {open: Number, close: Number}
        }
    }
    req.files = {
        photos: Image || [Image]
    }
    */
    update: async function(req, res){
        if(req.body.url && req.body.url !== res.locals.vendor.url){
            let urlCheck = await helper.checkUrl(req.body.url);
            if(urlCheck === "exists") return res.json("URL already taken, please choose another.");
            if(urlCheck === "chars") return res.json("URL may only contain letters, numbers or '-'");
            if(urlCheck === "error") return res.json("ERROR: unable to validate url");
        }

        if(res.locals.vendor === null) throw "vendor";

        if(req.body.name) res.locals.vendor.name = req.body.name;
        if(req.body.email) res.locals.vendor.email = req.body.email;
        if(req.body.description) res.locals.vendor.description = req.body.description;
        if(req.body.url) res.locals.vendor.url = req.body.url;
        if(req.body.hours) res.locals.vendor.hours = JSON.parse(req.body.hours);

        if(req.body.address){
            const apiUrl = "https://api.geocod.io/v1.6/geocode";
            const address = req.body.address;
            const fullUrl = `${apiUrl}?q=${address}&api_key=${process.env.MARKET_GEOENCODE_KEY}&limit=1`;
            let geoData = await axios({
                method: "get",
                url: fullUrl
            }).catch((err)=>console.error(err));
            let result = geoData.data.results[0];
            let lat = result.location.lat;
            let lng = result.location.lng;
            let comps = result.address_components;

            res.locals.vendor.address = {
                streetNumber: comps.number,
                road: comps.formatted_street,
                city: comps.city,
                county: comps.county,
                state: comps.state,
                country: comps.country,
                zipCode: comps.zip,
                full: result.formatted_address
            };

            res.locals.vendor.location = {
                type: "Point",
                coordinates: [lng, lat]
            };
        }

        let promises = [res.locals.vendor.save()];
        let originals = [];
        if(req.files.length > 0){
            for(let i = 0; i < res.locals.vendor.photos.length; i++){
                fs.unlink(`${appRoot}${res.locals.vendor.photos[i]}`, (err)=>{});
            }
            res.locals.vendor.photos = [];
        }

        for(let i = 0; i < req.files.length; i++){
            let file = req.files[i];

            let newImage = sharp(`${appRoot}/uploads/${file.filename}`)
                .resize(1000, 750)
                .toFormat("webp")
                .toFile(`${appRoot}/vendor-photos/${file.filename}.webp`)
                .catch((err)=>{
                    console.error(err);
                });

            promises.push(newImage);
            res.locals.vendor.photos.push(`/vendor-photos/${file.filename}.webp`);

            originals.push(`${appRoot}/uploads/${file.filename}`);
        }

        Promise.all(promises)
            .then((response)=>{
                response[0].password = undefined;

                res.json(response[0]);

                for(let i = 0; i < originals.length; i++){
                    fs.unlink(originals[i], (err)=>{console.error(err)});
                }
            })
            .catch((err)=>{
                switch(err){
                    case "vendor": return res.json("This vendor does not exist");
                    default:
                        console.error(err);
                        return res.json("ERROR: unable to update vendor");
                }
            });
    },

    /*
    PUT: update publicly accessible information of the vendor
    req.body = {
        vendor: Vendor id, required
        streetNumber: Boolean, optional
        road: Boolean, optional
        city: Boolean, optional
        county: Boolean, optional
        state: Boolean, optional
        email: Boolean, optional
        searchable: Boolean, optional
    }
    response = Vendor
    */
    publicData: function(req, res){
        if(req.body.streetNumber !== undefined) res.locals.vendor.publicData.streetNumber = req.body.streetNumber;
        if(req.body.road !== undefined) res.locals.vendor.publicData.road = req.body.road;
        if(req.body.city !== undefined) res.locals.vendor.publicData.city = req.body.city;
        if(req.body.county !== undefined) res.locals.vendor.publicData.county = req.body.county;
        if(req.body.state !== undefined) res.locals.vendor.publicData.state = req.body.state;
        if(req.body.email !== undefined) res.locals.vendor.publicData.email = req.body.email;
        if(req.body.searchable !== undefined) res.locals.vendor.publicData.searchable = req.body.searchable;

        res.locals.vendor.save()
            .then((vendor)=>{
                vendor.password = undefined;

                return res.json(vendor);
            })
            .catch((err)=>{
                switch(err){
                    case "vendor": return res.json("Unable to find this vendor");
                    default:
                        console.error(err);
                        return res.json("ERROR: unable to update vendor");
                }
            });
    },

    /*
    PUT: update style choices for the vendor's homepage
    req.body = {
        mainColor: String, optional
        secondaryColor: String, optional
        textColor: String, optional
    }
    response = {
        mainColor: String
        secondaryColor: String
        textColor: String
    }
    */
    updateStyle: function(req, res){
        let style = res.locals.vendor.style;

        if(req.body.mainColor) style.mainColor = req.body.mainColor;
        if(req.body.secondaryColor) style.secondaryColor = req.body.secondaryColor;
        if(req.body.textColor) style.textColor = req.body.textColor;

        res.locals.vendor.save()
            .then((vendor)=>{
                return res.json(vendor.style);
            })
            .catch((err)=>{
                console.error(err);
                return res.json("ERROR: unable to update style preferences");
            });
    },

    /*
    POST: vendor login route
    req.body = {
        email: email, required
        password: String, required
    }
    response = {
        vendor: Vendor
        jwt: JSON web token
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

                let token = jwt.sign({
                    _id: v._id.toString(),
                    email: v.email,
                    passHash: v.password
                }, process.env.JWT_SECRET);
                
                v.password = undefined;

                return res.json({
                    vendor: v,
                    jwt: token
                });
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

    /*
    PUT: create/update/remove products from vendor
    req.body = {
        create: [{
            name: String
            unit: String
            quantity: Number
        }]
        update: [{
            _id: Product id
            name: String, optional
            unit: String, optional
            quantity: Number, optional
        }],
        remove: [Product id]
    }
    response = [Product] (all vendor products)
    */
    updateProducts: function(req, res){
        if(req.body.remove){
            for(let i = 0; i < req.body.remove.length; i++){
                for(let j = 0; j < res.locals.vendor.products.length; j++){
                    if(req.body.remove[i] === res.locals.vendor.products[j]._id.toString()){
                        res.locals.vendor.products.splice(j, 1);
                        break;
                    }
                }
            }
        }

        if(req.body.update){
            for(let i = 0; i < req.body.update.length; i++){
                for(let j = 0; j < res.locals.vendor.products.length; j++){
                    if(req.body.update[i]._id === res.locals.vendor.products[j]._id.toString()){
                        if(req.body.update[i].name) res.locals.vendor.products[j].name = req.body.update[i].name;
                        if(req.body.update[i].unit) res.locals.vendor.products[j].unit = req.body.update[i].unit;
                        if(req.body.update[i].quantity) res.locals.vendor.products[j].quantity = req.body.update[i].quantity;
                        break;
                    }
                }
            }
        }

        if(req.body.create){
            for(let i = 0; i < req.body.create.length; i++){
                res.locals.vendor.products.push(new Product({
                    name: req.body.create[i].name,
                    unit: req.body.create[i].unit,
                    quantity: req.body.create[i].quantity,
                }));
            }
        }

        res.locals.vendor.save()
            .then((vendor)=>{
                return res.json(vendor.products);
            })
            .catch((err)=>{
                console.error(err);
                return res.json("ERROR: unable to update products");
            });
    },

    /*
    GET: retrieve data from a single vendor
    Data may be different if there is a logged in vendor
    req.params.url = Vendor custom url
    response = Vendor
    */
    retrieve: function(req, res){
        Vendor.findOne({url: req.params.url})
            .then((vendor)=>{
                let auth = req.headers["authorization"];

                try{
                    const authData = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
                    if(authData._id == vendor._id.toString()){
                        vendor.password = undefined;
                        return res.json({
                            vendor: vendor,
                            loggedIn: true
                        });
                    }
                }catch(e){
                    vendor = helper.removeHiddenVendorData(vendor);

                    return res.json({
                        vendor: vendor,
                        loggedIn: false
                    });
                }
            })
            .catch((err)=>{
                console.error(err);
                return "ERROR: unable to retrieve vendor data";
            });
    }
}