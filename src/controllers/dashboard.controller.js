import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Playlist } from "../models/playlist.model.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const userId = req.user._id;

    // const totalVideos = await Video.countDocuments({
    //     owner: userId
    // })

    const videoStats = await Video.aggregate([
        {
            $match: {
                owner: userId
            }
        },

        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },

        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments"
            }
        },

        {
            $group: {
                _id: null,
                totalViews: {
                    $sum: "$views"
                },

                totalVideos: {
                    $sum: 1
                },

                totalLikes: {
                    $sum: {
                        $size: "$likes"
                    }
                },

                totalComments: {
                    $sum: {
                        $size: "$comments"
                    }
                }
            }
        },
    ])

    const subscriberStats = await Subscription.aggregate([
        {
            $match: {
                channel: userId
            }
        },
        {
            $group: {
                _id: null,
                totalSubscribers: {
                    $sum: 1
                }
            }
        }
    ])

    const stats = {
        ...(videoStats[0] || {
            totalViews: 0,
            totalVideos: 0,
            totalLikes: 0,
            totalComments: 0
        }),
        ...(subscriberStats[0] || {
            totalSubscribers: 0
        })
    }

    return res.status(200).json(new ApiResponse(200, stats, "Fetched Channel stats successfully"))

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const userId = req.user._id

    const videos = await Video.aggregate([
        {
            $match: {
                owner: userId
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                totalLikes: {
                    $size: "$likes"
                }
            }
        },
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                totalLikes: 1,
            }
        },
    ])

    return res.status(200).json(new ApiResponse(200, videos, "Fetched all uploaded videos successfully"))

})

export {
    getChannelStats,
    getChannelVideos
}