const CustomError = require("./error");
const Enum = require("../config/enum");

class Response{
    constructor(){}
    static successResponse(data, code  = 200){
        return{
            code,
            data
        }
    }
    static erorResponse(error){
        console.error(error);
        
        if(error instanceof CustomError){
            return {
                code: error.code, 
                error:{
                    message: error.message,
                    description: error.description
                }
            }
        }else if(error.message.includes("E11000")){
            return{
                code: Enum.HTTP_CODES.CONFLICT,
                error:{
                    message: "Already Exits!",
                    description: "Already Exits!"
                }
            }
        }
        return {
            code:Enum.HTTP_CODES.INT_SERVER_ERROR , 
            error:{
                message: "Unknowm Error!",
                description: error.message
            }
        }

    }
}

module.exports = Response;