/**
 * @file server.js
 * @description This is the main entry point of the application. It handles server clustering and socket.io setup.
 * @requires cluster - A module to create child processes that share server ports.
 * @requires os - A module to get information about the operating system.
 * @requires http - A module to create HTTP servers.
 * @requires socket.io - A library to enable real-time, bidirectional communication between web clients and servers.
 * @requires configureSocket - A module to configure socket.io for real-time communication.
 * @requires app - The Express application from app.js.
 * @author Anil Bhandari
 * @version 1.0.0
 */

import cluster from "cluster";
import os from "os";
import { createServer } from "http";
import { Server } from "socket.io";
import configureSocket from "./socketHandler.js";
import app from "./app.js";

/**
 * Clustering server.js
 */
// const numCpus = os.cpus().length;

// if (cluster.isPrimary) {
//   console.log(`Primary ${process.pid} is running`);

//   // Fork workers
//   for (let i = 0; i < numCpus; i++) {
//     cluster.fork();
//   }

//   cluster.on("exit", (worker, code, signal) => {
//     console.log(`Worker ${worker.process.pid} died`);
//     // Restart the worker
//     cluster.fork();
//   });
// } else {
//   // Worker process - this is where your Express app runs
//   const httpServer = createServer(app);

//   // Socket.io configuration
//   const io = new Server(httpServer, {
//     cors: {
//       origin: [
//         "http://localhost:8081",
//         "http://10.0.2.2:8081",
//         "http://192.168.20.68:8081",
//       ],
//       methods: ["GET", "POST"],
//       credentials: true,
//     },
//   });

//   // Configure socket.io
//   configureSocket(io);

//   // Attach io to app for use in routes
//   app.set("io", io);

//   // Start the server
//   httpServer.listen(8000, () => {
//     console.log(`Worker ${process.pid} started on port 8000`);
//   });
// }
/*********************
 * Just for launching app -> not handled more users
 * 
 * 
 */
const httpServer = createServer(app);

// Socket.io configuration
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:8081",
      "http://10.0.2.2:8081",
      "http://192.168.20.68:8081",
      "https://nepalkammaserver.fly.dev"
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Configure socket.io
configureSocket(io);

// Attach io to app for use in routes
app.set("io", io);

const PORT = process.env.PORT || 8000;
const HOST = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";

// Start the server
httpServer.listen(PORT, HOST , () => {
  console.log(`Worker ${process.pid} started on port 8000`);
});
