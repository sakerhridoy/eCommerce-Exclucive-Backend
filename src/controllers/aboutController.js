import About from '../models/aboutModel.js';
import { asyncHandler, sendResponse } from '../utils/index.js';
import { uploadOnCloudinary } from '../utils/constants/cloudinary.js';

export const getAboutData = asyncHandler(async (req, res) => {
  const about = await About.findOne();
  sendResponse(res, { data: about });
});

export const updateAboutData = asyncHandler(async (req, res) => {
  let about = await About.findOne();
  let newImageUrl = about?.imageUrl || '';

  if (req.file) {
    const uploadResult = await uploadOnCloudinary(req.file.path);

    if (uploadResult) {
      newImageUrl = uploadResult.secure_url;
    }
  }

  if (about) {
    about.title = req.body.title || about.title;
    about.paragraph1 = req.body.paragraph1 || about.paragraph1;
    about.paragraph2 = req.body.paragraph2 || about.paragraph2;
    about.imageUrl = newImageUrl;
    await about.save();
  } else {
    about = await About.create({ ...req.body, imageUrl: newImageUrl });
  }

  sendResponse(res, {
    message: 'About page updated successfully',
    data: about,
  });
});