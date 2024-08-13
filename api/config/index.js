/* eslint-disable no-undef */
module.exports = {
    "PORT": process.env.PORT || "3000",
    "LOG_LEVEL": process.env.LOG_LEVEL || "debug",
    "MONGODB_URI": process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/exbackend",
    "JWT": {
        "SECRET": "123456",
        "EXPIRE_TIME": !isNaN(parseInt(process.env.TOKEN_EXPIRE_TIME)) ? parseInt(process.env.TOKEN_EXPIRE_TIME) :24*60*60 //86400
    },
    "DEFAULT_LANG": process.env.DEFAULT_LANG || "EN"
}