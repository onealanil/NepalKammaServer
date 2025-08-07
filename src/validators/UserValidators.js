import { check, validationResult } from "express-validator";

export const signUpValidation = [
  check("username")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Username is required")
    .isString()
    .withMessage("Username must be a string")
    .isLength({ min: 3, max: 14 })
    .withMessage("Username must be between 3 to 14 characters"),
  check("email")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Email is required")
    .normalizeEmail()
    .isEmail()
    .withMessage("Invalid email address"),
  check("password")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  check("role")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Role is required")
    .isString()
    .withMessage("Role must be a string")
    .isIn(["job_provider", "job_seeker", "admin"])
    .withMessage("Role must be either user or admin"),
  check("fcm_token").trim(),
  check("security_answer").trim().not().isEmpty().withMessage("Security answer is required"),
  check("location")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Location is required")
    .isString()
    .withMessage("Location must be a string"),
];

export const loginValidation = [
  check("email")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Email is required")
    .normalizeEmail()
    .isEmail()
    .withMessage("Invalid email address"),
  check("password").trim().not().isEmpty().withMessage("Password is required"),
  check("fcm_token").trim(),
];

export const signupValidationResult = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const error = result.array()[0].msg;
    return res.status(422).json({ message: error });
  }
  next();
};
