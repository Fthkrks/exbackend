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
const auth = require("../utils/auth")();

/* GET users listing. */

router.post("/register", async (req, res) => {
  let body = req.body;
  try {
    let user = await Users.findOne({});
    if (user) res.sendStatus(Enum.HTTP_CODES.NOT_FOUND);

    if (!body.email)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validition Error!",
        "email field must be filled"
      );

    if (is.not.email(body.email))
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validition error!",
        "email field must be an email format"
      );

    if (!body.password)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validition Eror!",
        "password field must be filled"
      );

    if (body.password.length < Enum.PASS_LENGTH) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validition Error!",
        "password length be greater than" + Enum.PASS_LENGTH
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

router.post("/auth", async(req, res) =>{
  try {
    let {email, password} = req.body;

    Users.validateFieldBeforeAuth(email, password);

    let user = await Users.findOne({email});

    if(!user) throw new CustomError(Enum.HTTP_CODES.UNAUTHORIZED, "Validition Error!", "Email or password wrong");

    if(!user.validPassword(password)) throw new CustomError(Enum.HTTP_CODES.UNAUTHORIZED, "Validition Error!", "Email or password wrong");


    let payload = {
      id: user._id,
      exp: parseInt(Date.now() / 1000) * config.JWT.EXPIRE_TIME
    }


    let token = jwt.encode(payload, config.JWT.SECRET);

    let userData = {
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name
    }

    res.json(Response.successResponse({token, user:{userData}}));

  } catch (error) {
    let errorResponse = Response.erorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
})

router.all("*", auth.authenticate(), (req, res, next) =>{
  next();
})


router.get("/", auth.checkRoles("user_view") ,async (req, res) => {
  try {
    let users = await Users.find({});
    res.json(Response.successResponse(users));
  } catch (error) {
    res.json(Response.erorResponse(error));
  }
});

router.post("/add", auth.checkRoles("user_add") ,async (req, res) => {
  let body = req.body;

  try {
    if (!body.email)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validition Error!",
        "email field must be filled"
      );

    if (is.not.email(body.email))
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validition error!",
        "email field must be an email format"
      );

    if (!body.password)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validition Eror!",
        "password field must be filled"
      );

    if (body.password.length < Enum.PASS_LENGTH) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validition Error!",
        "password length be greater than" + Enum.PASS_LENGTH
      );
    }

    if (!body.roles || !Array.isArray(body.roles) || body.roles.length === 0) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validition error!",
        "roles field must be an array"
      );
    }

    let roles = await Roles.find({ _id: { $in: body.roles } });

    if (roles.length === 0)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validition Error!",
        "roles field must be an array"
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

router.post("/update" ,async (req, res) => {
  let body = req.body;
  try {
    let updates = {};

    if (!body._id)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validition Error!",
        "_id field must be filled"
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
        "Validition Error!",
        "roles field must be an array"
      );

    await Users.updateOne({ _id: body._id }, updates);

    res.json(Response.successResponse({ success: true }));
  } catch (error) {
    let errorResponse = Response.erorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/delete", auth.checkRoles("user_delete") ,async (req, res) => {
  let body = req.body;
  try {
    if (!body._id)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validition Error!",
        "_id fields must be filled"
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
