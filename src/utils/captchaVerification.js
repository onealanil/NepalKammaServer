import { StatusCodes } from "http-status-codes";
import logger from "./logger.js";

export const captchaVerification = async (req, res, next) => {
    const captchaToken = req.body.captchaToken;
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`;
    try {
        const response = await fetch(verifyUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        const data = await response.json();
        logger.info('Captcha verification', {
            success: data.success,
            score: data.score,
            action: data.action,
            requestId: req.requestId
        });
        if (!data.success) {
            logger.warn('Captcha failed', { requestId: req.requestId });
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Please verify you are not a robot" });
        }
        if (data.score < 0.5) {
            logger.warn('Captcha failed', { requestId: req.requestId });
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Please verify you are not a robot" });
        }
        next();
    } catch (error) {
        logger.warn('Captcha failed', { requestId: req.requestId });
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Please verify you are not a robot" });
    }
};