const express = require("express");
const mongoose = require("mongoose");
const compression = require("compression");
const cors = require("cors");
const https = require("https");
const fs = require("fs");

global.appRoot = __dirname;

const app = express();

let mongooseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true
}

let httpsServer = {};
if(process.env.NODE_ENV === "production"){
    httpsServer = https.createServer({
        key: fs.readFileSync("/etc/letsencrypt/live/market/privkey.pem", "utf8"),
        cert: fs.readFileSync("/etc/letsencrypt/live/market/fullchain.pem", "utf8")
    }, app);

    app.use((req, res, next)=>{
        if(req.secure === true){
            next();
        }else{
            res.redirect(`https://${req.headers.host}${req.url}`);
        }
    });

    mongooseOptions.auth = {authSource: "admin"};
    mongooseOptions.user = "website";
    mongooseOptions.pass = process.env.MONGODB_PASS;
}

mongoose.connect("mongodb://127.0.0.1/market", mongooseOptions);

let corsOrigin = process.env.NODE_ENV === "production" ? "https://myvillage.market" : "http://localhost:5173";

app.use(compression());
app.use(express.json());
app.use(cors({origin: corsOrigin}));

require("./routes")(app);

if(process.env.NODE_ENV === "production"){
    module.exports = app;
}else{
    app.listen(process.env.PORT);
}