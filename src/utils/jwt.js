import jwt from "jsonwebtoken";

const secretKey = process.env.JWT_SECRET_KEY || "defaultSecretKey";

export const generateToken = (payload, expiresIn = "12h") => {
  return jwt.sign(payload, secretKey, { expiresIn });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, secretKey);
  } catch (error) {
    throw new Error("Session expired. Please login again.");
  }
};

export const decodeToken = (token) => {
  return jwt.decode(token);
};
