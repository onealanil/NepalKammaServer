/**
 * @file notFound.js
 * @description: This file contains the notFoundHandler middleware function that handles 404 errors.
 * It sends a JSON response with a status of 'error' and a message indicating that the requested route was not found.
 */

/**
 * @function notFoundHandler
 * @description Middleware function to handle 404 errors.
 * @param req - The request object.
 * @param res - The response object.
 * @returns void
 */
export const notFoundHandler = (req, res) => {
    res.status(404).json({ status: 'error', message: `Route ${req.originalUrl} not found` });
};