import permissions from "./permissions.js";

const rolePermissions = {
  user: [
    permissions.READ_PLACES,
    permissions.UPLOAD_POST,
    permissions.WRITE_CONTRIBUTIONS,
    permissions.WRITE_REVIEWS,
  ],
  business: [
    permissions.EDIT_BUSINESS_PROFILE,
    permissions.VIEW_BUSINESS_DASHBOARD,
    permissions.RESPOND_REVIEWS,
    permissions.VIEW_BOOKINGS,
  ],
  admin: ["*"],
};

export default rolePermissions;
