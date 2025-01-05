const express = require("express");
const { FriendModel } = require("../models/friend.model");
const suggestionRouter = express.Router();
const mongoose = require("mongoose");

suggestionRouter.get('/', async (req, res) => {
    const currentUserId = req.user.UserID;

    if (!currentUserId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        // Aggregation pipeline
        const suggestions = await FriendModel.aggregate([
            // Step 1: Find all direct friends of the current user
            {
                $match: {
                    $or: [
                        { user1: new mongoose.Types.ObjectId(currentUserId) },
                        { user2: new mongoose.Types.ObjectId(currentUserId) },
                    ],
                    status: 'accepted', // Only consider accepted friendships
                },
            },
            {
                $project: {
                    friendId: {
                        $cond: [
                            { $eq: ['$user1', new mongoose.Types.ObjectId(currentUserId)] },
                            '$user2',
                            '$user1',
                        ],
                    },
                },
            },

            // Step 2: Use the list of friend IDs to find their friends
            {
                $lookup: {
                    from: 'friends', // The collection name for the `FriendModel`
                    let: { friendId: '$friendId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $or: [{ $eq: ['$user1', '$$friendId'] }, { $eq: ['$user2', '$$friendId'] }] },
                                        { $ne: ['$user1', new mongoose.Types.ObjectId(currentUserId)] },
                                        { $ne: ['$user2', new mongoose.Types.ObjectId(currentUserId)] },
                                        { $eq: ['$status', 'accepted'] },
                                    ],
                                },
                            },
                        },
                        {
                            $project: {
                                friendOfFriendId: {
                                    $cond: [
                                        { $eq: ['$user1', '$$friendId'] },
                                        '$user2',
                                        '$user1',
                                    ],
                                },
                            },
                        },
                    ],
                    as: 'friendsOfFriends',
                },
            },

            // Step 3: Unwind friends of friends for simpler processing
            { $unwind: '$friendsOfFriends' },

            // Step 4: Exclude users who are already friends with the current user
            {
                $lookup: {
                    from: 'friends',
                    let: { suggestedFriendId: '$friendsOfFriends.friendOfFriendId' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $or: [{ $eq: ['$user1', new mongoose.Types.ObjectId(currentUserId)] }, { $eq: ['$user2', new mongoose.Types.ObjectId(currentUserId)] }] },
                                        { $or: [{ $eq: ['$user1', '$$suggestedFriendId'] }, { $eq: ['$user2', '$$suggestedFriendId'] }] },
                                        { $eq: ['$status', 'accepted'] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: 'alreadyFriends',
                },
            },
            {
                $match: {
                    alreadyFriends: { $size: 0 }, // Exclude users who are already friends
                },
            },

            // Step 5: Lookup details of suggested friends from the `users` collection
            {
                $lookup: {
                    from: 'users', // The collection name for the `User` model
                    localField: 'friendsOfFriends.friendOfFriendId',
                    foreignField: '_id',
                    as: 'friendDetails',
                },
            },

            // Step 6: Format the result with restricted fields
            {
                $project: {
                    friendDetails: {
                        $arrayElemAt: ['$friendDetails', 0],
                    },
                },
            },
            {
                $project: {
                    'friendDetails._id': 1,
                    'friendDetails.name': 1,
                    'friendDetails.email': 1,
                    'friendDetails.dp': 1,
                },
            },

            // Step 7: Remove duplicates
            {
                $group: {
                    _id: '$friendDetails._id',
                    friendDetails: { $first: '$friendDetails' },
                },
            },
        ]);

        res.json({ suggestions });
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        res.status(500).json({ error: 'An error occurred while fetching suggestions' });
    }
});

module.exports = { suggestionRouter };
