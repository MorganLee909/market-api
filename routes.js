const vendor = require("./controllers/vendor.js");

module.exports = (app)=>{
    //DOCS
    app.get("/api", (req, res)=>{res.sendFile(`${__dirname}/api.html`)});
    app.get("/api.css", (req, res)=>{res.sendFile(`${__dirname}/api.css`)});

    //VENDOR
    app.post("/api/vendor", vendor.create);
    app.put("/api/vendor", vendor.update);
    app.post("/api/vendor/login", vendor.login);
    app.get("/api/vendor/logout", vendor.logout);
    app.get("/api/vendor/:id", vendor.retrieve);
}