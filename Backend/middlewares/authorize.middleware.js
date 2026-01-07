import rolePermissions from "../constants/rolePermissions.js";
import { ApiError } from "../utils/ApiError.js";

export const authorize = (permission, context) => {
  return (req, res, next) => {
    const user = req.user;
    const permissions = rolePermissions[user.role] || [];
    if (!permissions.includes("*") && !permissions.includes(permission)) {
      throw new ApiError(403, "Forbidden");
    }
    if (context === "business" && !user.linkedBusiness) {
      throw new ApiError(403, "This is not a business account");
    }
    next();
  };
};
