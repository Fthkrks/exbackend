var express = require("express");
var router = express.Router();
const Users = require("../models/user.model");
const Response = require("../utils/response");
const CustomError = require("../utils/error");
const Enum = require("../config/enum");
const bcrypt = require("bcrypt");
const is = require("is_js");
const UserRoles = require("../models/userRole.model");
const Roles = require("../models/roles.model");
const RolePrivileges = require("../models/rolePrivileges.model");
const config = require("../config");
const jwt = require("jwt-simple");
const i18n = new (require("../utils/i18n"))(config.DEFAULT_LANG);
const auth = require("../utils/auth")();
const {rateLimit} = require("express-rate-limit");
const RateLimitMongo = require("rate-limit-mongo");


const limiter = rateLimit({
  store: new RateLimitMongo({
    uri: config.MONGODB_URI,
    collectionName: "rateLimits",
    expireTimeMs: 15 * 60 *100, // 15 minutes
  }),
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 5, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	// standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
});

/* GET users listing. */

router.post("/register", async (req, res) => {
  let body = req.body;
  try {
    let user = await Users.findOne({});
    if (user) res.sendStatus(Enum.HTTP_CODES.NOT_FOUND);

    if (!body.email)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDITION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MIUST_BE_FILLED", req.user.language, [
          "email",
        ])
      );

    if (is.not.email(body.email))
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDITION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MUST_BE_TYPE", req.user.language, ["email","email",])
      );

    if (!body.password)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDITION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MIUST_BE_FILLED", req.user.language, ["password"])
      );

    if (body.password.length < Enum.PASS_LENGTH) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDITION_ERROR_TITLE", req.user.language),
        i18n.translate("USER.LENGTH_ERROR", req.user.language, ["password", Enum.PASS_LENGTH])
      );
    }

    let password = bcrypt.hashSync(body.password, bcrypt.genSaltSync(8), null);

    let createdUser = await Users.create({
      email: body.email,
      password,
      is_active: true,
      first_name: body.first_name,
      last_name: body.last_name,
      phone_number: body.phone_number,
    });

    let role = await Roles.create({
      role_name: Enum.SUPER_ADMIN,
      is_active: true,
      created_by: createdUser._id,
    });

    await UserRoles.create({
      role_id: role._id,
      user_id: createdUser._id,
    });

    res
      .status(Enum.HTTP_CODES.CREATED)
      .json(
        Response.successResponse({ success: true }, Enum.HTTP_CODES.CREATED)
      );
  } catch (error) {
    let errorResponse = Response.erorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/auth", limiter, async (req, res) => {
  try {
    let { email, password } = req.body;

    Users.validateFieldBeforeAuth(email, password);

    let user = await Users.findOne({ email });

    if (!user)
      throw new CustomError(
        Enum.HTTP_CODES.UNAUTHORIZED,
        i18n.translate("COMMON.VALIDITION_ERROR_TITLE", config.DEFAULT_LANG),
        i18n.translate("USER.AUTH_ERROR", config.DEFAULT_LANG),
      );

    if (!user.validPassword(password))
      throw new CustomError(
        Enum.HTTP_CODES.UNAUTHORIZED,
        i18n.translate("COMMON.VALIDITION_ERROR_TITLE", config.DEFAULT_LANG),
        i18n.translate("USER.AUTH_ERROR", config.DEFAULT_LANG),
      );

    let payload = {
      id: user._id,
      exp: parseInt(Date.now() / 1000) * config.JWT.EXPIRE_TIME,
    };

    let token = jwt.encode(payload, config.JWT.SECRET);

    let userData = {
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
    };

    res.json(Response.successResponse({ token, user: { userData } }));
  } catch (error) {
    let errorResponse = Response.erorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.all("*", auth.authenticate(), (req, res, next) => {
  next();
});

router.get("/", auth.checkRoles("user_view"), async (req, res) => {
  try {
    let users = await Users.find({}, {password: 0}).lean();

    for(let i =0; i < users.length; i++){
      let roles = await UserRoles.find({user_id: users[i]._id}).populate("role_id");
      users[i].roles = roles;
    }

    res.json(Response.successResponse(users));
  } catch (error) {
    res.json(Response.erorResponse(error));
  }
});

router.post("/add", auth.checkRoles("user_add"), async (req, res) => {
  let body = req.body;

  try {
    if (!body.email)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDITION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MIUST_BE_FILLED", req.user.language, ["email"])
      );

    if (is.not.email(body.email))
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDITION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MUST_BE_TYPE", req.user.language, ["email", "email"]),
      );

    if (!body.password)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDITION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MIUST_BE_FILLED", req.user.language, ["password"])
      );

    if (body.password.length < Enum.PASS_LENGTH) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDITION_ERROR_TITLE", req.user.language),
        i18n.translate("USER.LENGTH_ERROR", req.user.language, ["password", Enum.PASS_LENGTH])
      );
    }

    if (!body.roles || !Array.isArray(body.roles) || body.roles.length === 0) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDITION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MUST_BE_TYPE", req.user.language, ["roles", "array"]),
      );
    }

    let roles = await Roles.find({ _id: { $in: body.roles } });

    if (roles.length === 0)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDITION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MUST_BE_TYPE", req.user.language, ["roles", "array"]),

      );

    let password = bcrypt.hashSync(body.password, bcrypt.genSaltSync(8), null);

    let user = await Users.create({
      email: body.email,
      password,
      is_active: true,
      first_name: body.first_name,
      last_name: body.last_name,
      phone_number: body.phone_number,
    });

    for (let i = 0; i < roles.length; i++) {
      await UserRoles.create({
        role_id: roles[i]._id,
        user_id: user._id,
      });
    }

    res
      .status(Enum.HTTP_CODES.CREATED)
      .json(
        Response.successResponse({ success: true }, Enum.HTTP_CODES.CREATED)
      );
  } catch (error) {
    let errorResponse = Response.erorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/update", auth.checkRoles("user_update"), async (req, res) => {
  let body = req.body;
  try {
    let updates = {};

    if (!body._id)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDITION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MIUST_BE_FILLED", req.user.language, ["_id"])
      );

    if (body.password && body.password.length >= Enum.PASS_LENGTH) {
      updates.password = bcrypt.hashSync(
        body.password,
        bcrypt.genSaltSync(8),
        null
      );
    }

    if (typeof body.is_active === "boolean") updates.is_active = body.is_active;
    if (body.first_name) updates.first_name = body.first_name;
    if (body.last_name) updates.last_name = body.last_name;
    if (body.phone_number) updates.phone_number = body.phone_number;

    if(body._id == req.user.id){
      // throw new CustomError(Enum.HTTP_CODES.FORBIDDEN, i18n.translate("COMMON.NEED_PERMISSIONS", req.user.language), )
      body.role = {};
    }

    if (Array.isArray(body.roles) && body.roles.length > 0) {
      let userRoles = await UserRoles.find({ user_id: body._id });

      let removeRoles = userRoles.filter(
        (x) => !body.roles.includes(x.role_id)
      );
      let newRoles = body.roles.filter(
        (x) => !userRoles.map((r) => r.role_id).includes(x)
      );

      if (removeRoles.length > 0) {
        await UserRoles.deleteMany({
          _id: { $in: removeRoles.map((x) => x._id) },
        });
      }

      if (newRoles.length > 0) {
        for (let i = 0; i < newRoles.length; i++) {
          let userRole = new UserRoles({
            role_id: newRoles[i],
            user_id: body._id,
          });

          await userRole.save();
        }
      }
    }

    let roles = await Roles.find({ _id: { $in: body.roles } });

    if (roles.length === 0)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDITION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MUST_BE_TYPE", req.user.language, ["roles", "array"]),
      );

    await Users.updateOne({ _id: body._id }, updates);

    res.json(Response.successResponse({ success: true }));
  } catch (error) {
    let errorResponse = Response.erorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/delete", auth.checkRoles("user_delete"), async (req, res) => {
  let body = req.body;
  try {
    if (!body._id)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.VALIDITION_ERROR_TITLE", req.user.language),
        i18n.translate("COMMON.FIELD_MIUST_BE_FILLED", req.user.language, ["_id"])
      );

    await Users.findOneAndDelete({ _id: body._id });

    await UserRoles.deleteMany({ user_id: body._id });

    res.json(Response.successResponse({ success: true }));
  } catch (error) {
    let errorResponse = Response.erorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

module.exports = router;
