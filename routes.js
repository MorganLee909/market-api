const vendor = require("./controllers/vendor.js");

const vendorAuth = require("./middleware.js").vendorAuth;

module.exports = (app)=>{
    //DOCS
    app.get("/docs", (req, res)=>{res.sendFile(`${__dirname}/api.html`)});
    app.get("/docs.css", (req, res)=>{res.sendFile(`${__dirname}/api.css`)});

    //VENDOR
    app.get("/vendor/search", vendor.search)
    app.post("/vendor", vendor.create);
    app.put("/vendor", vendor.update);
    app.put("/vendor/public", vendor.publicData);
    app.put("/vendor/style", vendorAuth, vendor.updateStyle);
    app.post("/vendor/login", vendor.login);
    app.get("/vendor/:url", vendor.retrieve);
    app.put("/vendor/product", vendorAuth, vendor.updateProducts);

    //FILES
    app.get("/vendor-photos/:file", (req, res)=>res.sendFile(`${appRoot}/vendor-photos/${req.params.file}`));
}