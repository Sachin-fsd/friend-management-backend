const express = require("express");
const { FriendModel } = require("../models/friend.model");
const { PendingModel } = require("../models/pending.model");
const requestRouter = express.Router();

requestRouter.post("/accept/:id", async (req, res) => {
    try {
        let user1 = req.user.UserID;
        let user2 = req.params.id;

        // Find the pending request in the PendingModel
        const friendRequest = await PendingModel.findOne({
            $or: [
                { user1, user2 },
                { user1: user2, user2: user1 },
            ],
        });

        if (!friendRequest) {
            return res.status(404).json({ msg: "Request not found" });
        }

        // Update the FriendModel status to "accepted"
        const existingFriend = await FriendModel.findOne({
            $or: [
                { user1, user2 },
                { user1: user2, user2: user1 },
            ],
            status: "pending", // Only update if the status is still 'pending'
        });

        if (existingFriend) {
            // Update the status to 'accepted'
            await FriendModel.updateOne(
                { _id: existingFriend._id },
                { $set: { status: "accepted" } }
            );
        } else {
            // If no existing pending relationship, create a new one
            await FriendModel.create({
                user1,
                user2,
                status: "accepted",
            });
        }

        // Delete the pending request from PendingModel
        await PendingModel.deleteOne({
            $or: [
                { user1, user2 },
                { user1: user2, user2: user1 },
            ],
        });

        res.status(200).json({ msg: "Friend request accepted successfully" });
    } catch (error) {
        console.log(error);
        res.status(400).json({ msg: "Error processing request" });
    }
});

requestRouter.post("/reject/:id", async (req, res) => {
    try {
        let user1 = req.user.UserID;
        let user2 = req.params.id;

        // Remove the pending request from PendingModel
        const result = await PendingModel.deleteOne({
            $or: [
                { user1, user2 },
                { user1: user2, user2: user1 },
            ],
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ msg: "Request not found" });
        }

        // Optionally, if you want to also delete the FriendModel relationship if it's still pending:
        await FriendModel.deleteOne({
            $or: [
                { user1, user2 },
                { user1: user2, user2: user1 },
            ],
            status: "pending",
        });

        res.status(200).json({ msg: "Friend request rejected successfully" });
    } catch (error) {
        console.log(error);
        res.status(400).json({ msg: "Error processing request" });
    }
});

module.exports = { requestRouter };
