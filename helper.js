const Vendor = require("./models/vendor.js");

module.exports = {
    generateSession: function(length){
        let result = "";
        let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        
        for(let i = 0; i < length; i++){
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        return result;
    },

    removeHiddenVendorData: function(vendor){
        let a = vendor.address;
        let p = vendor.publicData;

        if(!p.streetNumber) a.streetNumber = undefined;
        if(!p.road) a.road = undefined;
        if(!p.city) a.city = undefined;
        if(!p.county) a.county = undefined;
        if(!p.state) a.state = undefined;
        if(!p.email) a.email = undefined;
        if(!p.searchable) a.searchable = undefined;

        vendor.password = undefined;
        vendor.session = undefined;
        vendor.createdDate = undefined;
        vendor.publicData = undefined;

        return vendor;
    },

    checkUrl: function(url){
        url = url.toLowerCase();
        if(/^[a-zA-Z0-9-]*$/.test(url)){
            return Vendor.findOne({url: url})
                .then((vendor)=>{
                    if(vendor) return "exists";
                    
                    return true;
                })
                .catch((err)=>{
                    console.error(err);
                    return "error";
                })
        }else{
            return "chars";
        }
    }
}