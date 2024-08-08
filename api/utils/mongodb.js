const chalk = require("chalk");
const mongoose = require("mongoose");


let instance = null;

class Database{
    constructor(){
        if(!instance){
            this.monggoConnection = null;
            instance = this;
        }

        return instance;
    }

    async connect(options){
        try {
            let db = await mongoose.connect(options.MONGODB_URI);
            this.monggoConnection = db;
            console.log(chalk.bgGreen("MongoDB Database connected!"))
        } catch (error) {
            console.log(chalk.bgRed("MongoDB Database Don't connected!"))
            console.log(error);
            process.exit(1);
            
        }

    }
}

module.exports = Database;