const vendor = require("./controllers/vendor.js");

module.exports = (app)=>{
    //DOCS
    app.get("/docs", (req, res)=>{res.sendFile(`${__dirname}/api.html`)});
    app.get("/docs.css", (req, res)=>{res.sendFile(`${__dirname}/api.css`)});

    //VENDOR
    app.get("/vendor/search", vendor.search)
    app.post("/vendor", vendor.create);
    app.put("/vendor", vendor.update);
    app.put("/vendor/public", vendor.publicData);
    app.post("/vendor/login", vendor.login);
    app.get("/vendor/:id", vendor.retrieve);
}