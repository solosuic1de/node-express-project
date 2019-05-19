const User = require("./models/user");
const path = require("path");
const bodyParser = require("body-parser");
const busboy = require("busboy-body-parser");
const express = require("express");
const app = express();
const mustache = require("mustache-express");
const mongoose = require('mongoose');
const config = require('./config');
const databaseUrl = config.DatabaseUrl;
const serverPort = config.ServerPort;
const passport = require("passport");
const cookieParser = require('cookie-parser');
const session = require('express-session');


const connectOptions = {
  useNewUrlParser: true
};
const cloudinary = require("cloudinary");
cloudinary.config({
  cloud_name: "ntuu-kpi",
  api_key: "262216613312754",
  api_secret: "lZ2sV-0mdAZH8HSNZ97KvpM58-M"
});
mongoose.connect(databaseUrl, connectOptions)
  .then(() => console.log(`Database connected: ${databaseUrl}`))
  .then(() => app.listen(serverPort, () => console.log(`Server is started: ${serverPort}`)))
  .catch(err => console.log(`Start error: ${err}`));

require("./passport");

app.engine("mst", mustache(path.join(__dirname, "views", "partials")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "mst");
app.use(express.static("public"));
app.use(express.static("data"));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(cookieParser());
app.use(session({
  secret: config.secret_key,
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(busboy());

const bookRouter = require('./routes/books');
app.use("/", bookRouter);
const userRouter = require('./routes/users');
app.use("/", userRouter);
const collectionsRouter = require('./routes/bookCollections');
app.use("/", collectionsRouter);
const auth = require('./routes/auth');
app.use("/", auth);
const api = require('./routes/api');
app.use("/api/v1", api);
const dev = require('./routes/developer');
app.use("/developer/v1", dev);

app.get("/", function (req, res) {
  res.render("index", {
    user: req.user
  });
});
app.get("/about", function (req, res) {
  res.render("about", {
    user: req.user
  });
});