import express from "express";
import { protect } from "../domains/auth/middlewares/auth.js";
import { checkAuthentication } from "../domains/auth/checkAuthentication.js";
import { validate } from "../domains/auth/middlewares/validate.js";
const router = express.Router();

router.get("/check-auth", protect, validate, checkAuthentication);

export default router;
