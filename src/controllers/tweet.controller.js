import mongoose from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet

    const { content } = req.body

    if (!content) {
        throw new ApiError(400, "Content is required")
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user._id
    })

    if (!tweet) {
        throw new ApiError(500, "Something went wrong while creating tweet")
    }

    return res.status(200).json(new ApiResponse(200, tweet, "Tweet created Successfully"))

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    const { userId } = req.params

    if (!userId) {
        throw new ApiError(400, "userId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invlaid user id")
    }

    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(404, "user not found")
    }

    const tweets = await Tweet.find({
        owner: userId
    })

    return res.status(200).json(new ApiResponse(200, tweets, "Fetched user tweets successfully"))

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    const { tweetId } = req.params
    const { content } = req.body

    if (!content) {
        throw new ApiError(400, "Content is required")
    }

    if (!tweetId) {
        throw new ApiError(400, "TweetId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(400, "Invalid Tweet Id")
    }

    const updatedTweet = await Tweet.findOneAndUpdate(
        {
            _id: tweetId,
            owner: req.user._id
        },
        {
            $set: {
                content
            }
        },
        {
            new: true
        }
    )
        .populate("owner", "username fullName avatar coverImage email")


    if (!updatedTweet) {
        throw new ApiError(404, "Tweet not found or unauthorized request")
    }

    return res.status(200).json(new ApiResponse(200, updatedTweet, "Update tweet Successfully"))

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    const { tweetId } = req.params

    if (!tweetId) {
        throw new ApiError(400, "TweetId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(400, "Invalid Tweet Id")
    }

    const deletedTweet = await Tweet.findOneAndDelete(
        {
            _id: tweetId,
            owner: req.user._id
        },
    )

    if (!deletedTweet) {
        throw new ApiError(404, "tweet not found or unauthorized request")
    }

    return res.status(200).json(new ApiResponse(200, deletedTweet, "Delete tweet successfully"))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
