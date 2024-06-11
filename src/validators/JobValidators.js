import { check, validationResult } from "express-validator";

const skillsRequiredValidator = (value) => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("At least one skill is required");
  }
  return true;
};

const paymentRequiredValidator = (value) => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("At least one payment method is required");
  }
  return true;
};

export const createJobValidation = [
  check("title")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Title is required")
    .isString()
    .withMessage("Title must be a string"),
  check("location")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Location is required")
    .isString()
    .withMessage("Location must be a string"),
  check("phoneNumber")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Phone number is required")
    .isString()
    .withMessage("Phone number must be a string"),
  check("skills_required")
    .isArray()
    .withMessage("Skills required must be an array")
    .custom(skillsRequiredValidator),
  check("job_description")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Job description is required")
    .isString()
    .withMessage("Job description must be a string"),
  check("payment_method")
    .isArray()
    .withMessage("Payment method must be an array")
    .custom(paymentRequiredValidator),
  check("price").isNumeric().withMessage("Price must be a number"),
  check("category")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Category is required")
    .isString()
    .withMessage("Category must be a string"),
];

export const createJobValidationResult = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const error = result.array()[0].msg;
    return res.status(422).json({ message: error });
  }
  next();
};
