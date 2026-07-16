import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription
    if (!channelId) {
        throw new ApiError(400, "Channel Id is required")
    }

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid Channel id")
    }

    const channel = await User.findById(channelId)

    if (!channel) { 
        throw new ApiError(404, "Channel not found")
    }

    const alreadySubscribed = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user._id
    })


    if (alreadySubscribed) {
        await Subscription.findOneAndDelete({
            channel: channelId,
            subscriber: req.user._id
        })

        return res.status(200).json(new ApiResponse(200, {}, "Unsubscribe successfully"))
    }


    await Subscription.create({
        channel: channelId,
        subscriber: req.user._id
    })

    return res.status(200).json(new ApiResponse(200, {}, "Subscribe successfully"))

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    console.log(channelId)

    if (!channelId) {
        throw new ApiError(400, "Channel id is required")
    }

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }

    const channel = await User.findById(channelId)
    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }

    const aggregate = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            email: 1,
                            avatar: 1,
                            fullName: 1,
                            coverImage: 1
                        }
                    }
                ]
            }
        },
    ])

    return res.status(200).json(new ApiResponse(200, aggregate, "Fetched Subscriber list successfully"))

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!subscriberId){
        throw new ApiError(400, "subscriber Id is required")
    }

    if(!mongoose.Types.ObjectId.isValid(subscriberId)){
        throw new ApiError(400, "Invalid subscriber Id")
    }

    const subscriber = await User.findById(subscriberId)
    if(!subscriber){
        throw new ApiError(404, "subscriber not found")
    }

    const aggregate = await Subscription.aggregate([
        {
            $match : {
                subscriber :  new mongoose.Types.ObjectId(subscriberId),
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "channel",
                foreignField: "_id",
                as : "channelsSubscribedTo",
                pipeline : [
                    {
                        $project : {
                            username : 1,
                            email : 1,
                            fullName : 1,
                            avatar : 1,
                            coverImage : 1
                        }
                    }
                ]
            }
        },
    ])

    return res.status(200).json(new ApiResponse(200, aggregate, "Fetched Channels list successfully"))

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}