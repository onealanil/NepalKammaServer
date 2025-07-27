/**
 * @file app.js
 * @description This file contains the Express application setup, middleware configuration, and route definitions.
 * @requires express - A web framework for Node.js.
 * @requires body-parser - A middleware to parse incoming request bodies.
 * @requires cors - A middleware to enable Cross-Origin Resource Sharing.
 * @requires cloudinary - A cloud-based image and video management service.
 * @requires request-promise - A library to make HTTP requests with promises.
 * @requires path - A module to work with file and directory paths.
 * @requires url - A module to work with URLs.
 * @requires connectMongo - A module to connect to MongoDB.
 * @requires firebase - A module to interact with Firebase services.
 * @requires updateJobVisibility - A module to update job visibility in the background.
 * @requires user - A module that contains user-related routes.
 * @requires auth - A module that contains authentication-related routes.
 * @requires job - A module that contains job-related routes.
 * @requires Gig - A module that contains gig-related routes.
 * @requires Message - A module that contains message-related routes.
 * @requires Admin - A module that contains admin-related routes.
 * @requires Payment - A module that contains payment-related routes.
 * @requires Review - A module that contains review-related routes.
 * @requires Notification - A module that contains notification-related routes.
 * @requires Report - A module that contains report-related routes.
 * @requires dotenv - A module to load environment variables from a .env file.
 * @author Anil Bhandari
 * @version 1.0.0
 */

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import cloudinary from "cloudinary";
import requestp from "request-promise";
import cookieParser from "cookie-parser";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import connectMongo from "./config/connection.js";
import { updateJobVisibility } from "./src/utils/BackgroundTask.js";

// Routes
import user from "./src/routes/User.js";
import auth from "./src/routes/Auth.js";
import job from "./src/routes/Job.js";
import Gig from "./src/routes/Gig.js";
import Message from "./src/routes/Message.js";
import Admin from "./src/routes/Admin.js";
import Payment from "./src/routes/Payment.js";
import Review from "./src/routes/Review.js";
import Notification from "./src/routes/Notification.js";
import Report from "./src/routes/Report.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Create Express app
const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:3000",  
    "http://localhost:3001",    
    "http://localhost:8080",    
    "http://localhost:8081",    
    "http://127.0.0.1:3000",   
    "http://127.0.0.1:8080",  
    "http://127.0.0.1:5500", 
    "http://127.0.0.1:5501",  
    "https://nepalkammaserver.fly.dev"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With", 
    "Content-Type", 
    "Accept", 
    "Authorization",
    "Cache-Control"
  ],
};

// ---------- Handling CORS Issue --------------------
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Add headers manually as backup
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

/**
 * Using the necessary packages
 */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Database connection
connectMongo();

// Cloudinary Config
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

// Start the background task for updating job visibility
updateJobVisibility();

/**
 * All routing included
 * (user, auth, job, Gig, Message, Admin, Payment, Review, Notification, Report)
 */

// routes for user
app.use("/api/v1/user", user);

// routes for auth
app.use("/api/v1/auth", auth);

// routes for job
app.use("/api/v1/job", job);

// routes for gigs
app.use("/api/v1/gig", Gig);

// routes for message
app.use("/api/v1/message", Message);

// routes for admin
app.use("/api/v1/admin", Admin);

// routes for payment
app.use("/api/v1/payment", Payment);

// routes for review
app.use("/api/v1/review", Review);

// routes for notification
app.use("/api/v1/notification", Notification);

// routes for report
app.use("/api/v1/report", Report);

// Khalti payment gateway
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

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the application.",
  });
});

export default app;
