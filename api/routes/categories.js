var express = require("express");
var router = express.Router();
const Categories = require("../models/categories.model");
const Response = require("../utils/response");
const CustomError = require("../utils/error");
const Enum = require("../config/enum");
const AuditLogs = require("../utils/AuditLogs");
const logger = require("../utils/logger/LoggerClass");
const config = require("../config");
const auth = require("../utils/auth")();
const i18n = new (require("../utils/i18n"))(config.DEFAULT_LANG);

router.all("*", auth.authenticate(), (req, res, next) =>{
  next();
})

/* GET users listing. */
router.get("/", auth.checkRoles("category_view") , async (req, res,) => {
  try {
    let categories = await Categories.find({});
    res.json(Response.successResponse(categories));
  } catch (error) {
    res.json(Response.erorResponse(error));
  }
});

router.post("/add", auth.checkRoles("category_add") , async (req, res) => {
  let body = req.body;
  try {
    if (!body.name) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDITION_ERROR_TITLE", req.user.language,),
        i18n.translate("COMMON.FIELD_MIUST_BE_FILLED", req.user.language, ["name"])
      );
    }

    let category = new Categories({
      name: body.name,
      is_active: true,
      created_by: req.user?.id,
    });

    await category.save();

    AuditLogs.info( req.user?.email, "Categories", "Add", category);
    logger.info(req.user?.email, "Categories", "Add", category);

    res.json(Response.successResponse({ success: true }));
  } catch (error) {
    logger.error(req.user?.email, "Categories", "Add", error)
    let errorResponse = Response.erorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/update", auth.checkRoles("category_update") ,async (req, res) => {
  let body = req.body;

  try {
    if (!body._id)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDITION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MIUST_BE_FILLED", req.user.language, ["_id"])
      );
    let updates = {};

    if (body.name) updates.name = body.name;
    if (typeof body.is_active === "boolean") updates.is_active = body.is_active;

    await Categories.updateOne({ _id: body._id }, updates);

    AuditLogs.info(req.user?.email, "Categories", "Update", {_id: body._id, ...updates})


    res.json(Response.successResponse({ success: true }));
  } catch (error) {
    let errorResponse = Response.erorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/delete", auth.checkRoles("category_delete") , async (req, res) => {
  let body = req.body;

  try {
    if (!body._id)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDITION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MIUST_BE_FILLED", req.user.language, ["_id"])
      );

    await Categories.findOneAndDelete({ _id: body._id });

    AuditLogs.info(req.user?.email, "Categories", "Delete", {_id: body._id})


    res.json(Response.successResponse({ success: true }));
  } catch (error) {
    let errorResponse = Response.erorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

module.exports = router;
