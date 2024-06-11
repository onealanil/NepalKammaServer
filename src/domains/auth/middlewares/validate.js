import { validationResult } from "express-validator";
import createError from "../../../utils/createError.js";

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }
  const errorMsg = errors.array()[0].msg;
  throw createError(422, errorMsg);
};
