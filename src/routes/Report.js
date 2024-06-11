import express from "express";
import { protect } from "../domains/auth/middlewares/auth.js";
import { createReport } from "../domains/report/controller/index.js";

const router = express.Router();

router.route("/createReport").post(protect, createReport);

export default router;
