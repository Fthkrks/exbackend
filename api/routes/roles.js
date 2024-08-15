const express = require("express");
const router = express.Router();
const Response = require("../utils/response");
const Roles = require("../models/roles.model");
const RolePrivileges = require("../models/rolePrivileges.model");
const CustomError = require("../utils/error");
const Enum = require("../config/enum");
const role_privilages = require("../config/rolePrivilages");
const config = require("../config");
const auth = require("../utils/auth")();
const i18n = new (require("../utils/i18n"))(config.DEFAULT_LANG);
const UserRole = require("../models/userRole.model");

router.all("*", auth.authenticate(), (req, res, next) =>{
  next();
})

router.get("/", auth.checkRoles("roles_view") , async (req, res) => {
  try {
    let roles = await Roles.find({}).lean();

   // roles = JSON.parse(JSON.stringify(roles)); 2.yol permission göstermek için 

    for (let i=0; i <roles.length; i++){
      let permission = await RolePrivileges.find({role_id: roles[i]._id});
      roles[i].permission = permission;
    }

    res.json(Response.successResponse(roles));
  } catch (error) {
    let erorResponse = Response.erorResponse(error);
    res.status(erorResponse.code).json(erorResponse);
  }
});

router.post("/add", auth.checkRoles("roles_add") ,async (req, res) => {
  let body = req.body;
  try {
    if (!body.role_name)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDITION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MIUST_BE_FILLED", req.user.language, ["role_name"])
      );

    if (
      !body.permissions ||
      !Array.isArray(body.permissions) ||
      body.permissions.lenght == 0
    ) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validation Error!",
        "permissions field must be an array"
      );
    }

    let role = new Roles({
      role_name: body.role_name,
      is_active: true,
      created_by: body.user?.id,
    });

    await role.save();

    for (let i = 0; i < body.permissions.length; i++) {
      let priv = new RolePrivileges({
        role_id: role._id,
        permission: body.permissions[i],
        created_by: req.user?.id,
      });

      await priv.save();
    }

    res.json(Response.successResponse({ success: true }));
  } catch (error) {
    let errorResponse = Response.erorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/update", auth.checkRoles("roles_update") ,async (req, res) => {
  let body = req.body;
  try {
    if (!body._id)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDITION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MIUST_BE_FILLED", req.user.language, ["_id"])
      );

      let userRole = await UserRole.findOne({user_id: req.user.id, role_id: body._id})
      if(userRole){
        throw new CustomError(Enum.HTTP_CODES.FORBIDDEN, i18n.translate("COMMON.NEED_PERMISSIONS", req.user.language), )
      }


    let updates = {};

    if (body.role_name) updates.role_name = body.role_name;
    if (typeof body.is_active === "boolean") updates.is_active = body.is_active;
    if (
      body.permissions &&
      Array.isArray(body.permissions) &&
      body.permissions.length > 0
    ) {
      let permissions = await RolePrivileges.find({ role_id: body._id });

      let removedPermissions = permissions.filter(
        (x) => !body.permissions.includes(x.permission)
      );

      let newPermissions = body.permissions.filter(
        (x) => !permissions.map((p) => p.permission).includes(x)
      );

      if (removedPermissions.length > 0) {
        await RolePrivileges.deleteMany({
          _id: { $in: removedPermissions.map((x) => x._id) },
        });
      }

      if (newPermissions.length > 0) {
        for (let i = 0; i < newPermissions.length; i++) {
          let priv = new RolePrivileges({
            role_id: body._id,
            permission: newPermissions[i],
            created_by: req.user?.id,
          });

          await priv.save();
        }
      }
    }

    await Roles.updateOne({ _id: body._id }, updates);

    res.json(Response.successResponse({ success: true }));
  } catch (error) {
    let errorResponse = Response.erorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/delete", auth.checkRoles("roles_delete") ,async (req, res) => {
  let body = req.body;
  try {
    if (!body._id)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDITION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MIUST_BE_FILLED", req.user.language, ["_id"])
      );

    await Roles.findOneAndDelete({ _id: body._id });

    res.json(Response.successResponse({ success: true }));
  } catch (error) {
    let errorResponse = Response.erorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.get("/role_privilages" ,async (req, res) => {
  res.json(role_privilages);
});

module.exports = router;
