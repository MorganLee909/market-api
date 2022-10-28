const vendor = require("./controllers/vendor.js");

const vendorAuth = require("./middleware.js").vendorAuth;

const multer = require("multer");
const upload = multer({
    dest: "./uploads",
    limits: {
        fileSize: 1000 * 1000
    }
})

module.exports = (app)=>{
    //DOCS
    app.get("/docs", (req, res)=>{res.sendFile(`${__dirname}/api.html`)});
    app.get("/docs.css", (req, res)=>{res.sendFile(`${__dirname}/api.css`)});

    //VENDOR
    app.get("/vendor/search", vendor.search);
    app.post("/vendor", vendor.create);
    app.put("/vendor", vendorAuth, upload.array("images"), vendor.update);
    app.put("/vendor/public", vendorAuth, vendor.publicData);
    app.put("/vendor/style", vendorAuth, vendor.updateStyle);
    app.post("/vendor/login", vendor.login);
    app.put("/vendor/product", vendorAuth, vendor.updateProducts);
    app.get("/vendor/:url", vendor.retrieve);

    //FILES
    app.get("/vendor-photos/:file", (req, res)=>res.sendFile(`${appRoot}/vendor-photos/${req.params.file}`));
}