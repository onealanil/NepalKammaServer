/**
 * @file server.js
 * @description This is the main entry point of the application. It sets up the server, connects to the database, configures middleware, and defines routes for the application.
 * @requires express - A web framework for Node.js.
 * @requires body-parser - A middleware to parse incoming request bodies.
 * @requires cors - A middleware to enable Cross-Origin Resource Sharing.
 * @requires cloudinary - A cloud-based image and video management service.
 * @requires request-promise - A library to make HTTP requests with promises.
 * @requires cluster - A module to create child processes that share server ports.
 * @requires os - A module to get information about the operating system.
 * @requires path - A module to work with file and directory paths.
 * @requires url - A module to work with URLs.
 * @requires http - A module to create HTTP servers.
 * @requires socket.io - A library to enable real-time, bidirectional communication between web clients and servers.
 * @requires connectMongo - A module to connect to MongoDB.
 * @requires firebase - A module to interact with Firebase services.
 * @requires configureSocket - A module to configure socket.io for real-time communication.
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
 * @requires socketHandler - A module that handles socket events and communication.
 * @requires dotenv - A module to load environment variables from a .env file.
 * @author Anil Bhandari
 * @version 1.0.0
 *
 */

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import cloudinary from "cloudinary";
import requestp from "request-promise";
import cluster from "cluster";
var jsonParser = bodyParser.json();
import connectMongo from "./config/connection.js";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import os from "os";
import { updateJobVisibility } from "./src/utils/BackgroundTask.js";
// import socketHandler from "./socketHandler.js";
import { createServer } from "http";
import { Server } from "socket.io";

//routing------------------------------ (started)
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
//--------------------------------------(ended)

//firebase
import firebase from "./src/firebase/index.js";
import configureSocket from "./socketHandler.js";

/**
 * Clustering server.js
 */
const numCpus = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCpus; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    // Restart the worker
    cluster.fork();
  });
} else {
  // Worker process - this is where your Express app runs
  const app = express();
  /**
   * using the necessary package
   */
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(cors());
  app.use(jsonParser);

  const __dirname = dirname(fileURLToPath(import.meta.url));
  app.use(express.static(path.join(__dirname, "public")));

  //database connection
  await connectMongo();

  //cloudinary Config
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
  });

  //------------------------------------------------------------------------------
  /**
   * All routing included
   * (user, auth, job, Gig, Message, Admin, Payment, Review, Notification, Report)
   */

  //middleware
  app.use((req, res, next) => {
    req.io = io;
    next();
  });

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

  //routes for admin
  app.use("/api/v1/admin", Admin);

  //routes for payment
  app.use("/api/v1/payment", Payment);

  //routes for review
  app.use("/api/v1/review", Review);

  //routes for notification
  app.use("/api/v1/notification", Notification);

  //routes for report
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
        console.log(result);
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

  //------------------------------------------------------------------------------

  // Start the background task for updating job visibility
  updateJobVisibility();

  app.get("/", (req, res) => {
    res.json({
      message: "Welcome to the application.",
    });
  });

  const httpServer = createServer(app);
  // const io = new Server(httpServer, {
  //   cors: {
  //     origin: ["http://192.168.18.206:8081",
  //       "http://localhost:8081",
  //     ],
  //     methods: ["GET", "POST"],
  //     credentials: true

  //   },
  // });

  //for college ip
  const io = new Server(httpServer, {
    cors: { 
      origin: [
        "http://localhost:8081",
        "http://10.0.2.2:8081",
        "http://192.168.20.68:8081",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  configureSocket(io);

  httpServer.listen(8000, () => {
    console.log(`Worker ${process.pid} started on port 8000`);
  });
}
