const express = require("express");
const { getRoleById,getAllRoles,updateRoleById,createRole,deleteRole } = require("../controllers/role");

const router = express.Router();

router.get("/role/:id", getRoleById);
router.get("/getAllrole/:companyId",getAllRoles);
router.put("/roles/:id",updateRoleById);
router.post("/roles",createRole);
router.delete("/roles/:id",deleteRole)

module.exports = router;
