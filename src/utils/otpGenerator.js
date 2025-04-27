/**
 * @function generateOTP
 * @returns {string} - A 4-digit one-time password (OTP).
 * @description This function generates a random 4-digit OTP.
 */
export const generateOTP = () => {
  return `${Math.floor(1000 + Math.random() * 9000)}`;
};
