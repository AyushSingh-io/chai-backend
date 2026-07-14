import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

    if(!videoId){
        throw new ApiError(400, "VideoId is required")
    }

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid video Id")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video not found")
    }

    let toggleLike = await Like.findOneAndDelete(
        {
            likedBy : req.user._id,
            video : videoId
        }
    )

    if(!toggleLike){
        toggleLike = await Like.create(
            {
                video : videoId,
                likedBy : req.user._id
            }
        )
    }

    return res
    .status(200)
    .json(new ApiResponse(200, toggleLike , "Toggled the like on video"))

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if(!commentId){
        throw new ApiError(400, "comment id required")
    }

    if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(400, "invalid comment id")
    }

    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(404, "comment not found")
    }

    let toggleLike = await Like.findOneAndDelete(
        {
            likedBy : req.user._id,
            comment : commentId
        }
    )

    if(!toggleLike){
        toggleLike = await Like.create(
            {
                comment : commentId,
                likedBy : req.user._id
            }
        )
    }

    return res
    .status(200)
    .json(new ApiResponse(200, toggleLike , "Toggled the like on comment"))


})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet

    if(!tweetId){
        throw new ApiError(400, "tweet id required")
    }

    if(!mongoose.Types.ObjectId.isValid(tweetId)){
        throw new ApiError(400, "invalid tweet id")
    }

    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404, "tweet not found")
    }

    let toggleLike = await Like.findOneAndDelete(
        {
            likedBy : req.user._id,
            tweet : tweetId
        }
    )

    if(!toggleLike){
        toggleLike = await Like.create(
            {
                tweet : tweetId,
                likedBy : req.user._id
            }
        )
    }

    return res
    .status(200)
    .json(new ApiResponse(200, toggleLike , "Toggled the like on tweet"))
 
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const videos = await Like.find({
        likedBy : req.user._id,
        comment : null,
        tweet : null                                           
    })
    .populate("video")
    
    return res
    .status(200)
    .json(new ApiResponse(200, videos , "Fetched all liked videos successfully"))

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}