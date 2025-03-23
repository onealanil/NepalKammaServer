import express from "express";
const app = express();
import bodyParser from "body-parser";
import cors from "cors";
import cloudinary from "cloudinary";
import requestp from "request-promise";
var jsonParser = bodyParser.json();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(jsonParser);
import connectMongo from "./config/connection.js";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

//firebase
import firebase from "./src/firebase/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, "public")));

//database connection
await connectMongo;

//cloudinary Config
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

import socketHandler from "./socketHandler.js";

// socket IO implementation
import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://192.168.18.206:8081"],
  }
});

socketHandler(io);

//middleware
app.use((req, res, next) => {
  req.io = io;
  next();
});

// routes for user
import user from "./src/routes/User.js";
app.use("/api/v1/user", user);

// routes for auth
import auth from "./src/routes/Auth.js";
app.use("/api/v1/auth", auth);

// routes for job
import job from "./src/routes/Job.js";
app.use("/api/v1/job", job);

// routes for gigs
import Gig from "./src/routes/Gig.js";
app.use("/api/v1/gig", Gig);

// routes for message
import Message from "./src/routes/Message.js";
app.use("/api/v1/message", Message);

//routes for admin
import Admin from "./src/routes/Admin.js";
app.use("/api/v1/admin", Admin);

//routes for payment
import Payment from "./src/routes/Payment.js";
app.use("/api/v1/payment", Payment);

//routes for review
import Review from "./src/routes/Review.js";
app.use("/api/v1/review", Review);

//routes for notification
import Notification from "./src/routes/Notification.js";
app.use("/api/v1/notification", Notification);

//routes for report
import Report from "./src/routes/Report.js";
app.use("/api/v1/report", Report);

//khalti payment gateway
app.post("/charge", function (req, res) {
  var KHALTI_VERIFY = "https://khalti.com/api/v2/payment/verify/";
  let options = {
    method: "POST",
    uri: KHALTI_VERIFY,
    body: JSON.stringify({
      token: req.body.token,
      amount: req.body.amount,
    }),
    headers: {
      Authorization: `Key ${process.env.TEST_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  };
  requestp(options)
    .then((result) => {
      console.log(result)
      res.jsonp({
        data: result,
        status: "success",
      });
    })
    .catch((error) => {
      res.status(500).send({
        error: error.response.data,
        status: "failed",
      });
    });
});

import { updateJobVisibility } from "./src/utils/BackgroundTask.js";

// Start the background task for updating job visibility
updateJobVisibility();

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the application.",
  });
});


httpServer.listen(8000, () => console.log("App is listening on port 8000."));
