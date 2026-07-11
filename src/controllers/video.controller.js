import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    let { page = 1, limit = 10, query, sortBy = "views", sortType = "asc", userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    page = Number(page);
    limit = Number(limit);

    if (!userId) {
        throw new ApiError(400, "User Id is required");
    }

    if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new ApiError(400 , "UserID is not valid")
    }

    const ownerId = new mongoose.Types.ObjectId(userId);

    const match = {
        owner: ownerId,
        title: {
            $regex: query || "",
            $options: "i"
        }
    };


    if (!req.user._id.equals(ownerId)) {
        match.isPublished = true;
    }

    // const pipeline = [
    //     { $match: match }
    // ];

    const aggregate = Video.aggregate([
        {
            $match: match
        },
        {
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            email: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
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
                owner: 1,
                isPublished: 1
            }
        }
    ])

    const options = {
        page,
        limit
    }

    const videos = await Video.aggregatePaginate(
        aggregate,
        options
    )

    if (!videos || !videos?.docs.length) {
        throw new ApiError(404, "videos not found ");
    }

    return res.status(200)
        .json(new ApiResponse(200, videos, "videos fetched successfully"))

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video


    if (!title || !description) {
        throw new ApiError(400, "title and description are required")
    }

    const videoLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!videoLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "video file and thumbnail are required")
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!videoFile || !thumbnail) {
        throw new ApiError(400, "video file and thumbnail are required")
    }

    //create object of schema model:
    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        // views : 0,
        // isPublished : true,
        owner: req.user?._id
    })

    return res.status(200)
        .json(new ApiResponse(200, video, "Video pulished successfully"))

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if (!videoId) {
        throw new ApiError(400, "Video Id is required");
    }

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400 , "Invalid Video Id")
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "video not found")
    }

    if (!video.isPublished && !req.user._id.equals(video.owner)) {
        throw new ApiError(404, "Video not found")
    }


    const user = await User.findById(req.user._id);

    const alreadyWatched = user.watchHistory.some(
        (id) => id.equals(videoId)
    )

    if(!alreadyWatched){
        video.views++;
        user.watchHistory.push(video._id)

        await video.save({validateBeforeSave :false});
        await user.save({validateBeforeSave: false});
    }


    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video fetched successfully"))

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    

    const { title, description } = req.body;
    const thumbnailLocalPath = req.file?.path;


    if (!videoId) {
        throw new ApiError(400, "Video Id is required")
    }

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400 , "Invalid Video Id")
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "video not found")
    }


    if (!req.user._id.equals(video.owner)) {
        throw new ApiError(403, "Unauthorized request")
    }

    if (title) video.title = title;
    if (description) video.description = description;

    if (thumbnailLocalPath) {
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

        if (!thumbnail) {
            throw new ApiError(500, "Error while uploading to cloudinary")
        }

        video.thumbnail = thumbnail.url
    }

    await video.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Updated details successfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if (!videoId) {
        throw new ApiError(400, "Video Id is required")
    }

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400 , "Invalid Video Id")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(400, "video not found")
    }

    if (!req.user._id.equals(video.owner)) {
        throw new ApiError(403, "Unauthorized request")
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId)
    if (!deletedVideo) {
        throw new ApiError(500, "Error while deleting the video")
    }

    return res.status(200)
        .json(new ApiResponse(200, {}, "Video deleted Successfully"))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId) {
        throw new ApiError(400, "video Id is required")
    }

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400 , "Invalid Video Id")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(400, "video not found")
    }

    if (!req.user._id.equals(video.owner)) {
        throw new ApiError(403, "Unauthorized request")
    }

    video.isPublished = video.isPublished === true ? false : true;

    await video.save({ validateBeforeSave: false })

    return res.status(200)
        .json(new ApiResponse(200, video, "Toggled the publish status"))

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
