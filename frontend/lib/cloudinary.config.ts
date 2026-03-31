import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});



export const uploadImage = async (file: string) => {
    try {
        const result = await cloudinary.uploader.upload(file, {
            folder: 'AiInterviewer',
            resource_type: 'image',
        });
        return result.secure_url;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw new Error('Image upload failed');
    }
};  