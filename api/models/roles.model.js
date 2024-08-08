const mongoose = require("mongoose");
const RolePrivileges = require("../models/rolePrivileges.model");

const schema = mongoose.Schema(
  {
    role_name: { type: String, required: true, unique: true },
    is_active: { type: String, default: true },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  {
    versionKey: false,
    timestamps: {
      createdAt: "created-at",
      updatedAt: "updated_at",
    },
  }
);

class Roles extends mongoose.Model {
  static async findOneAndDelete(query) {
    if (query._id) {
      await RolePrivileges.deleteMany({ role_id: query._id });
    }

    await super.deleteMany(query);
  }
}

schema.loadClass(Roles);
module.exports = mongoose.model("Roles", schema);
