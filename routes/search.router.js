const express = require("express");
const { RegisterModel } = require("../models/register.model");

const searchRouter = express.Router();

searchRouter.get("/", async (req, res) => {
  try {
    const { query } = req.query;
    if (query && query !== null) {
      // console.log("query from search", query);
      const regex = new RegExp(query, "i");
      const users = await RegisterModel.find(
        { name: { $regex: regex } },
        { password: 0 }
      );

      res.status(200).json({users});
    }
    //  else {
    //   const users = await RegisterModel.find(
    //     {},
    //     { password:0}
    //   ).sort({updatedAt:-1}).limit(10);
    //   // console.log("send users")
    //   res.render("search", { users, UserDetails: req.body.UserDetails });
    //   // res.send({users,posts:[]})
    // }
  } catch (error) {
    res.status(401).send({msg:"something went wrong"});
  }
});


module.exports = { searchRouter };
