const express = require("express");
const { RegisterModel } = require("../models/register.model");
const { FriendModel } = require("../models/friend.model");
const { mongoose } = require("mongoose");
const { PendingModel } = require("../models/pending.model");
const req = require("express/lib/request");


const feedRouter = express.Router();


feedRouter.get("/", async (req, res) => {
    try {
        const currentUserId = req.user?.UserID; // Ensure req.user is defined

        if (!currentUserId) {
            return res.status(400).json({ msg: "User not authenticated", ok: false });
        }

        const usersWithFriendStatus = await RegisterModel.aggregate([
            { $sort: { updatedAt: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "friends",
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $or: [
                                        {
                                            $and: [
                                                { $eq: ["$user1", new mongoose.Types.ObjectId(currentUserId)] },
                                                { $eq: ["$user2", "$$userId"] },
                                            ],
                                        },
                                        {
                                            $and: [
                                                { $eq: ["$user2", new mongoose.Types.ObjectId(currentUserId)] },
                                                { $eq: ["$user1", "$$userId"] },
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    ],
                    as: "friendship",
                },
            },
            {
                $addFields: {
                    friendStatus: {
                        $cond: {
                            if: { $gt: [{ $size: "$friendship" }, 0] },
                            then: { $arrayElemAt: ["$friendship.status", 0] },
                            else: "not_friend",
                        },
                    },
                },
            },
            {
                $project: {
                    password: 0,
                    friendship: 0,
                },
            },
            // Exclude the current user's profile from the result
            {
                $match: {
                    _id: { $ne: new mongoose.Types.ObjectId(currentUserId) }, // Exclude the current user's profile
                },
            },
        ]);

        res.status(200).send({ users: usersWithFriendStatus });
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ msg: "Server error", ok: false });
    }
});



feedRouter.post("/:id", async (req, res) => {
    try {
        let user2 = req.params.id;
        let user1 = req.user.UserID;
        console.log(user2)
        // Check if a friendship already exists between the two users
        const existingFriendship = await FriendModel.findOne({
            $or: [
                { user1, user2 },
                { user1: user2, user2: user1 },
            ],
        });

        if (existingFriendship) {
            console.log('Friendship already exists or request is pending');
            return;
        }

        const newFriendRequest = new FriendModel({
            user1,
            user2,
            status: 'pending', // The status is set to 'pending' when the request is sent
        });

        await newFriendRequest.save();
        await PendingModel.create({ user1, user2, sentBy: user1 })
        console.log('Friend request sent');
        return res.status(201).send({ msg: "Friend request send successfully" })
    } catch (error) {
        console.error('Error sending friend request:', error);
    }
})

feedRouter.get("/requests", async (req, res) => {
    try {
        let currentUser = req.user.UserID; // Assuming `req.user.UserID` contains the current user's ID

        // Find all pending friend requests where the current user is either user1 or user2
        // and where the request was not sent by the current user
        const pendingRequests = await PendingModel.find({
            $or: [{ user1: currentUser }, { user2: currentUser }],
            sentBy: { $ne: currentUser }, // Ensure that the request was not sent by the current user
        })
            .populate('user1 user2 sentBy', 'name email dp _id') // Populate relevant fields for user1, user2, and sentBy
            .sort({ createdAt: -1 }) // Sort by the most recent requests

        if (pendingRequests.length > 0) {
            // Adding the createdAt timestamp to the response
            const formattedRequests = pendingRequests.map(request => ({
                user1: request.user1,
                user2: request.user2,
                sentBy: request.sentBy,
                sentAt: request.createdAt, // Timestamp when the request was sent
            }));

            res.status(200).send({ pendingRequests: formattedRequests });
        } else {
            res.status(404).send({ msg: 'No pending friend requests' });
        }
    } catch (error) {
        console.log(error);
        res.status(400).send({ ok: false, error: error.message });
    }
});


feedRouter.delete("/:id", async (req, res) => {
    try {
        let user2 = req.params.id;
        let user1 = req.user.UserID;
        await PendingModel.deleteOne({
            $or: [
                { user1, user2 },
                { user1: user2, user2: user1 },
            ],
        });
        await FriendModel.deleteOne({
            $or: [
                { user1, user2 },
                { user1: user2, user2: user1 },
            ],
        })

        res.status(200).json({ msg: "Successfull" })
    } catch (error) {
        console.log(error);
        return res.status(400).json({ msg: "Some error occured" })
    }
})


feedRouter.get("/friends", async (req, res) => {
    try {
        const user1 = req.user.UserID;
        // console.log(user1);
        // Fetch friends where the current user is either `user1` or `user2`
        const friends = await FriendModel.find({
            $or: [
                { user1 },
                { user2: user1 },
            ],
            status: 'accepted', // Include only accepted friendships
        }).populate([
            { path: 'user1', select: 'id name email dp' }, // Populate user1 details
            { path: 'user2', select: 'id name email dp' }, // Populate user2 details
        ]);
        // console.log(friends)
        // Map the results to return the details of the friend (excluding the current user)
        const friendDetails = friends.map(friend => {
            if (friend.user1._id.toString() === user1) {
                return friend.user2; // Return user2 details if user1 is the current user
            } else {
                return friend.user1; // Return user1 details if user2 is the current user
            }
        });
        // console.log(friendDetails)
        res.status(200).json({ friends: friendDetails });
    } catch (error) {
        console.error('Error fetching friends:', error);
        res.status(400).json({ msg: 'Error at backend' });
    }
});


module.exports = { feedRouter };
