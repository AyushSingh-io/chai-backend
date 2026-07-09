import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        //console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}



const deleteFromCloudinary = async (oldImageUrl) => {
    try {
        if(!oldImageUrl)  return null;

        const startIdx = oldImageUrl.lastIndexOf('/');
        const publicId = oldImageUrl.slice(startIdx+ 1, oldImageUrl.length - 4);

        console.log("public ID  is  : ", publicId);

        if(!publicId)  return null;

        const response = await cloudinary.uploader.destroy(publicId , {
            resource_type : "image"
        })

        console.log("file deleted from cloudinary response : ", response)
        return response;

        
    } catch (error) {
        console.log("Error occured while deleting old avatar file: ", error)
        return null;
    }
}




export {uploadOnCloudinary , deleteFromCloudinary }