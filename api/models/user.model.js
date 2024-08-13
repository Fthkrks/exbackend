const mongoose = require("mongoose");
const is = require("is_js");
const {PASS_LENGTH, HTTP_CODES} = require("../config/enum");
const CustomError = require("../utils/error");
const bcrypt = require("bcrypt") 


const schema = mongoose.Schema({
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    is_active: {type: String, default: true},
    first_name: String,
    last_name: String,
    phone_number: String
},{
    versionKey: false,
    timestamps:{
        createdAt: "created-at",
        updatedAt: "updated_at",
    }
});

class Users extends mongoose.Model{

    validPassword(password){
        return bcrypt.compareSync(password, this.password);
    }

   static validateFieldBeforeAuth(email, password){
        if(typeof password !== "string" || password.length < PASS_LENGTH || is.not.email(email)){
            throw new CustomError(HTTP_CODES.UNAUTHORIZED, "validition Error!", "email or password wrong");
        }

        return null;
    }
}

schema.loadClass(Users);
module.exports = mongoose.model("Users", schema);