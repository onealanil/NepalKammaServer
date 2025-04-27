/**
 * @file catchAsync.js
 * @description This file contains a utility function to handle asynchronous errors in Express.js routes.
 * It wraps the route handler function and catches any errors that occur during its execution.
 * It then passes the error to the next middleware function for centralized error handling.
 * @param {Function} fn - The asynchronous route handler function to be wrapped.
 * @returns {Function} - A new function that wraps the original function and handles errors.
 */
export default (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
