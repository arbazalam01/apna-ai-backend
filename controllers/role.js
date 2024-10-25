
const Role = require('../models/RoleMaster');

// 1) Get role by id
const getRoleById = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);
        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }
        res.json(role);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 2) Get all roles
const getAllRoles= async (req, res) => {
    try {
        const { companyId } = req.params;
        console.log(companyId)
        const roles = await Role.find({companyId:companyId});
        res.json(roles);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 3) Update role
const updateRoleById= async (req, res) => {
    try {
        const role = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }
        res.json(role);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// 4) Create role
const createRole = async (req, res) => {
    try {
        const role = new Role(req.body);
        await role.save();
        res.status(201).json(role);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// 5) Delete role
const deleteRole= async (req, res) => {
    try {
        const role = await Role.findByIdAndDelete(req.params.id);
        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }
        res.json({ message: 'Role deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getRoleById,getAllRoles,updateRoleById,createRole,deleteRole };
