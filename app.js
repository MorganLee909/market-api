const express = require("express");
const mongoose = require("mongoose");
const compression = require("compression");
const session = require("cookie-session");
const https = require("https");
const fs = require("fs");

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

app.use(compression());
app.use(express.json());
app.use(session({
    secret: "Marketing many magnificent modern marvels",
    sameSite: "lax",
    saveUninitialized: true,
    resave: false
}));

require("./routes")(app);

if(process.env.NODE_ENV === "production"){
    httpsServer.listen(process.env.HTTPS_PORT);
}
app.listen(process.env.PORT);