const express = require("express");
const router = express.Router();
const Response = require("../utils/response");
const Auditlogs = require("../models/auditlogs.model");
const Categories = require("../models/categories.model");
const auth = require("../utils/auth")();
const Users = require("../models/user.model");

router.all("*", auth.authenticate(), (req, res, next) => {
  next();
});

/*
1. Audit logs tablosunda  işlem yapan kişilerin hangi tip işlemi kaç kez yaptığını veren sorgu
2. Kategori tablosunda tekil veri sayısı
3. Sistemde tamılı kaç kullanıcı var ?

*/

router.post("/auditlogs/categories", async (req, res) => {
  try {
    let result = await Auditlogs.aggregate([
      { $match: { location: "Categories" } },
      {
        $group: {
          _id: { email: "$email", proc_type: "$proc_type" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json(Response.successResponse(result));
  } catch (error) {
    let errorResponse = Response.erorResponse(req.user?.language);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/categories/unique", async (req, res) => {
  try {
    let result = await Categories.distinct("name", { is_active: true });
    res.json(Response.successResponse({ result, count: result.length }));
  } catch (error) {
    let errorResponse = Response.erorResponse(req.user?.language);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/users/count", async (req, res) => {
  try {
    let result = await Users.countDocuments({ is_active: true });
    res.json(Response.successResponse(result));
  } catch (error) {
    let errorResponse = Response.erorResponse(req.user?.language);
    res.status(errorResponse.code).json(errorResponse);
  }
});


module.exports = router;
