import mongoose from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    //TODO: create playlist
    if (!name || !description) {
        throw new ApiError(400, "Name and Description required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        videos: [],
        owner: req.user._id
    })

    if (!playlist) {
        throw new ApiError(500, "Error occured while creating playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist created successfully"))

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists

    if (!userId) {
        throw new ApiError(400, "User Id is required")
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid User id ")
    }

    const response = await Playlist
        .find(
            {
                owner: userId,
            })
        .populate("videos")
        .populate("owner", "username email  fullName avatar")


    if (!response || !response.length) {
        throw new ApiError(404, "Playlist not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, response, "Playlist fetched successfully"))

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id

    if (!playlistId) {
        throw new ApiError(400, "Playlist Id is required")
    }

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid Playlist Id ")
    }

    const playlist = await Playlist.findById(playlistId)
        .populate("videos")
        .populate("owner", "username email fullName avatar")

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist fetched successfully"))

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!playlistId || !videoId) {
        throw new ApiError(400, "Playlist Id and videoId required")
    }

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid Playlist Id")
    }
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video Id")
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const playlist = await Playlist.findOneAndUpdate(
        {
            _id: playlistId,
            owner: req.user._id
        },
        {
            $addToSet: { videos: videoId }
        },
        {
            new: true
        }
    )
        .populate("videos")
        .populate("owner", "username email  fullName avatar")

    if (!playlist) {
        throw new ApiError(404, "Playlist not found  or unauthorized request")
    }

    return res.status(200)
        .json(new ApiResponse(200, playlist, "Video added to the playlist"))

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist

    if (!playlistId || !videoId) {
        throw new ApiError(400, "Playlist and video id required")
    }

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "video not found")
    }

    const playlist = await Playlist.findOneAndUpdate(
        {
            _id: playlistId,
            owner: req.user._id
        },
        {
            $pull: { videos: videoId }
        },
        {
            new: true
        }
    )
        .populate("videos")
        .populate("owner", "username email  fullName avatar")

    if (!playlist) {
        throw new ApiError(404, "Playlist not found or unauthorized request")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Video deleted from playlist"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist

    if (!playlistId) {
        throw new ApiError(400, "playlist id required")
    }

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid playlist id ")
    }

    const deleted = await Playlist.findOneAndDelete(
        {
            _id: playlistId,
            owner: req.user._id
        }
    )

    if (!deleted) {
        throw new ApiError(404, "Playlist not found or unauthorized request")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, deleted, "Deleted playlist successfully"))

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist

    if (!playlistId) {
        throw new ApiError(400, "playlist id required")
    }

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid playlist id ")
    }

    if (!name && !description) {
        throw new ApiError(400, "New details required")
    }

    const playlist = await Playlist.findOne(
        {
            _id: playlistId,
            owner: req.user._id
        }
    );

    if (!playlist) {
        throw new ApiError(404, "Playlist not found or Unauthorized request")
    }

    if (name) {
        playlist.name = name
    }

    if (description) {
        playlist.description = description
    }

    await playlist.save({ validateBeforeSave: false })

    return res.status(200).json(new ApiResponse(200, playlist, "Updated the playlist"))

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
