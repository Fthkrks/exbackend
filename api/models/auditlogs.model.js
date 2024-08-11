const mongoose = require("mongoose");


const schema = mongoose.Schema({
    leveL: String,
    email: String,
    location: String,
    proc_type: String,
    log: mongoose.Schema.Types.Mixed
},{
    versionKey: false,
    timestamps:{
        createdAt: "created-at",
        updatedAt: "updated_at",
    }
});

class AuditLogs extends mongoose.Model{

}

schema.loadClass(AuditLogs);
module.exports = mongoose.model("AuditLogs", schema);