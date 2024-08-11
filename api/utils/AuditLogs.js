const AuditLogsModel = require("../models/auditlogs.model");
const Enum = require("../config/enum");

let instance = null;

class AuditLogs{
    constructor(){
        if(!instance){
            instance = this;
        }
        return instance
    }

    info(email, location, procTypes, log){
        this.#saveToDb({
            level: Enum.LOG_LEVELS.INFO, 
            email,
            location,
            procTypes,
            log
        })
    }

    warn(email, location, procTypes, log){
        this.#saveToDb({
            level: Enum.LOG_LEVELS.WARN, 
            email,
            location,
            procTypes,
            log
        })
    }

    error(email, location, procTypes, log){
        this.#saveToDb({
            level: Enum.LOG_LEVELS.ERROR, 
            email,
            location,
            procTypes,
            log
        })
    }

    debug(email, location, procTypes, log){
        this.#saveToDb({
            level: Enum.LOG_LEVELS.DEBUG, 
            email,
            location,
            procTypes,
            log
        })
    }


    verbose(email, location, procTypes, log){
        this.#saveToDb({
            level: Enum.LOG_LEVELS.VERBOSE, 
            email,
            location,
            procTypes,
            log
        })
    }


    http(email, location, procTypes, log){
        this.#saveToDb({
            level: Enum.LOG_LEVELS.HTTP, 
            email,
            location,
            procTypes,
            log
        })
    }

    #saveToDb({level, email, location, procTypes, log}){
        AuditLogsModel.create({
            level,
            email,
            location,
            procTypes,
            log
        });
    }
};


module.exports = new AuditLogs();