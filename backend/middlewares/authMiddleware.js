import jwt from "jsonwebtoken";
import {
  HttpError,
  assertCondition,
  handleControllerError,
} from "../utils/controllerHelpers.js";

export function authenticateJWT(req, res, next) {
  try {
    let token = req.cookies?.token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    assertCondition(token, 401, "Unauthorized - No token provided");

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      throw new HttpError(403, "Forbidden - Invalid token");
    }
  } catch (err) {
    return handleControllerError(res, err, "Authentication failed");
  }
}

export function authorizeRoles(...roles) {
  return (req, res, next) => {
    try {
      assertCondition(req.user, 401, "Unauthorized");
      assertCondition(
        roles.includes(req.user.role),
        403,
        "Access denied - insufficient permissions"
      );
      return next();
    } catch (err) {
      return handleControllerError(res, err, "Authorization failed");
    }
  };
}