const express = require("express");
const mongoose = require("mongoose");
const { RegisterModel } = require("../models/register.model");
const { FriendModel } = require("../models/friend.model");

const searchRouter = express.Router();

searchRouter.get("/", async (req, res) => {
  try {
    const { query } = req.query; // userId is the logged-in user
    const userId = req.user.UserID;
    if (query && query !== null && userId) {
      // Define regex for case-insensitive search
      const regex = new RegExp(query, "i");

      // Aggregate pipeline to get users with friendship status
      const users = await RegisterModel.aggregate([
        {
          $match: { name: { $regex: regex } } // Match users based on the search query
        },
        {
          $lookup: {
            from: "friends", // The collection where friendship data is stored
            let: { userId:new mongoose.Types.ObjectId(userId), otherUserId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $and: [{ $eq: ["$user1", "$$userId"] }, { $eq: ["$user2", "$$otherUserId"] }] },
                      { $and: [{ $eq: ["$user1", "$$otherUserId"] }, { $eq: ["$user2", "$$userId"] }] }
                    ]
                  }
                }
              }
            ],
            as: "friendship" // Alias for the results of the lookup
          }
        },
        {
          $unwind: {
            path: "$friendship",
            preserveNullAndEmptyArrays: true // Handle users without any friendship data
          }
        },
        {
          $addFields: {
            isFriend: {
              $cond: {
                if: { $eq: ["$friendship.status", "accepted"] },
                then: "accepted",
                else: {
                  $cond: {
                    if: { $eq: ["$friendship.status", "pending"] },
                    then: "pending",
                    else: "not_friend"
                  }
                }
              }
            }
          }
        },
        {
          $project: {
            password: 0,  // Exclude password from the response
            friendship: 0 // Exclude the friendship details if not needed
          }
        }
      ]);

      console.log("users=> ", users);
      res.status(200).json({ users });
    } else {
      res.status(400).send({ msg: "Query and userId are required" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ msg: "Something went wrong" });
  }
});

module.exports = { searchRouter };
