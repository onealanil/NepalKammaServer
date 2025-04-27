import bcrypt from "bcrypt";

/**
 * @function hashPassword
 * @param {*} password - The password to be hashed.
 * @param {*} salt - The number of rounds to use for hashing the password. Default is 12.
 * @returns {Promise<string>} - The hashed password.
 * @description This function takes a password and a salt value, hashes the password using bcrypt, and returns the hashed password.
 * @throws {Error} - Throws an error if the password is not a string or the salt is not a number.
 */
export const hashPassword = async (password, salt = 12) => {
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};
