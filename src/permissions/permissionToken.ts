import { isAuthenticated } from "./utils";

export const PermissionTokenMutationPermissions = {
  createPermissionToken: isAuthenticated,
}
