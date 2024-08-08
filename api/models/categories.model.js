const mongoose = require("mongoose");


const schema = mongoose.Schema({
    name: {type: String, required: true},
    is_active: {type: Boolean, default: true},
    created_by: { type: mongoose.Schema.Types.ObjectId},

},{
    versionKey: false,
    timestamps:{
        createdAt: "created-at",
        updatedAt: "updated_at",
    }
});

class Categories extends mongoose.Model{

}

schema.loadClass(Categories);
module.exports = mongoose.model("Categories", schema);