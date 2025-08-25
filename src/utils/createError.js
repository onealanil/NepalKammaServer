/**
 * @file createError.js
 * @description This file contains a utility function to create an error object with a specified status and message.
 * It is used to standardize error handling in the application.
 * @param {number} status - The HTTP status code for the error.
 * @param {string} message - The error message to be associated with the error.
 * @return {Error} - A new Error object with the specified status and message.
 * @throws {Error} - Throws an error if the status is not a number or the message is not a string.
 */
export default (status, message) => {
  const error = new Error(message);
  error.statusCode = status;
  return error;
};
