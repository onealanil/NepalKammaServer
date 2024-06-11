import { check, validationResult } from "express-validator";

const imagesRequiredValidators = (value) => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("At least one image is required");
  }
  return true;
};

export const createGigValidation = [
  check("title")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Title is required")
    .isString()
    .withMessage("Title must be a string"),
  check("gig_description")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Gig description is required")
    .isString()
    .withMessage("Gig description must be a string"),
  check("price").isNumeric().withMessage("Price must be a number"),
  check("category")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Category is required")
    .isString()
    .withMessage("Category must be a string"),
];

export const createGigValidationResult = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const error = result.array()[0].msg;
    return res.status(422).json({ message: error });
  }
  next();
};
