module.exports = {
    isValidEmail: function(email){
        return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);
    },

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

        vendor.publicData = undefined;

        return vendor;
    }
}