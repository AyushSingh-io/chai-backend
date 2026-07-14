import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!videoId) {
        throw new ApiError(400, "video id is required")
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const aggregate = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $sort : {
                createdAt : -1
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "CommentOwner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                            fullName: 1
                        }
                    }
                ]
            }
        },
        {
            $project: {
                content: 1,
                video: 1,
                CommentOwner: 1
            }
        }
    ])

    const options = {
        page: Number(page),
        limit: Number(limit)
    }


    const comments = await Comment.aggregatePaginate(
        aggregate,
        options
    )

    return res
        .status(200)
        .json(new ApiResponse(200, comments, "fetched video comments successfully"))

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video

    const { videoId } = req.params
    const { content } = req.body

    if (!videoId) {
        throw new ApiError(400, "Video id is required")
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    if (!content) {
        throw new ApiError(400, "Content required")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    })

    if (!comment) {
        throw new ApiError(500, "Something went wrong while adding comment")
    }

    await comment.populate(
        "owner",
        "username avatar fullName"
    );

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment added successfully"))

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    const { commentId } = req.params
    const { content } = req.body

    if (!content) {
        throw new ApiError(400, "New Content is required")
    }

    if (!commentId) {
        throw new ApiError(400, " Comment Id is required")
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid Comment Id")
    }

    const newComment = await Comment.findOneAndUpdate(
        {
            owner: req.user._id,
            _id: commentId
        },
        {
            $set: {
                content: content
            }
        },
        {
            new: true
        }
    )

    if (!newComment) {
        throw new ApiError(400, "comment not found or unauthorized request")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, newComment, "comment updated successfully"))

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const { commentId } = req.params

    if (!commentId) {
        throw new ApiError(400, " Comment Id is required")
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid Comment Id")
    }

    const deletedComment = await Comment.findOneAndDelete(
        {
            _id: commentId,
            owner: req.user._id
        },
    )

    if (!deletedComment) {
        throw new ApiError(400, "Comment not found or unauthorized request")
    }

    return res.status(200).json(new ApiResponse(200, deletedComment, "comment deleted successfully"))
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
