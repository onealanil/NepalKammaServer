import bcrypt from "bcrypt";

export const hashPassword = async (password, salt = 12) => {
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};
