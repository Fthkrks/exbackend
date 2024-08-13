const passport = require("passport");
const {ExtractJwt, Strategy} = require("passport-jwt");
const config = require("../config");
const Users = require("../models/user.model");
const UserRoles = require("../models/userRole.model");
const RolePrivilages  = require("../models/rolePrivileges.model");
const Response = require("./response");
const {HTTP_CODES} = require("../config/enum");

const privs = require("../config/rolePrivilages");
const CustomError = require("./error");

module.exports= function(){
    let strategy = new Strategy({
        secretOrKey: config.JWT.SECRET,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    },async(payload, done) =>{
        try {
            let user = await Users.findOne({_id: payload.id});

            if(!user){
                done(new Error("User not found"), null);
            }

            let userRoles = await UserRoles.find({user_id: payload._id});
    
            let rolePrivilages = await RolePrivilages.find({role_id: {$in: userRoles.map(ur =>ur.role_id)}});

            let privileges =  rolePrivilages.map((rp) => privs.privileges.find((x) => x.key === rp.permission))
            
            done(null, {
                id: user._id,
                roles: privileges,
                email: user.email,
                firs_name: user.firs_name,
                last_name: user.last_name,
                exp: parseInt(Date.now() / 1000) * config.JWT.EXPIRE_TIME    
            })
    
        } catch (error) {
            done(error, null)
        };

    });

    passport.use(strategy);

    return{
        initialize: function(){
            return passport.initialize();

        },

        authenticate: function(){
            return passport.authenticate("jwt", {session: false})
        },

        checkRoles: (...expectedRoles) =>{     
            let roles = [].concat(expectedRoles);

            console.log(roles);
            
            return (req, res, next) =>{
                let i = 0;


                let privileges = req.user.roles.filter((x) => x).map((x) => x.key);

                while (i < expectedRoles.length && !privileges.includes(roles[i])) i++;

                if (i >= expectedRoles.length) {

                    let response = Response.erorResponse(new CustomError(HTTP_CODES.UNAUTHORIZED, "Need Permission", "Need Permission"));
                    return res.status(response.code).json(response);
                }

                return next(); // Authorized

            }
        }
    }
}

