import { createHash, randomBytes } from 'node:crypto';
import { userRepository } from '../repositories/index.js';
import {
  AppError,
  generateAccessToken,
  generateRefreshToken,
  sendEmail,
  sendAdminAlert,
  deleteFromCloudinary,
} from '../utils/index.js';
import { uploadOnCloudinary } from '../utils/constants/cloudinary.js';
import { emailTemplates } from './emailTemplatesService.js';
import { config } from '../config/index.js';
import { verifyAccessToken, verifyRefreshToken } from '../utils/index.js';

export const register = async data => {
  const existingUser = await userRepository.findByEmail(data.email);
  if (existingUser) {
    throw new AppError('User already exists with this email', 400);
  }

  const verificationToken = randomBytes(32).toString('hex');
  const user = await userRepository.create({
    ...data,
    emailVerificationToken: createHash('sha256')
      .update(verificationToken)
      .digest('hex'),
    emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000,
  });

  try {
    const verificationLink = `${config.frontendUrl}/verifyemail/${verificationToken}`;
    await sendEmail({
      to: user.email,
      ...emailTemplates.emailVerification(user, verificationLink),
    });

    // Notify the store owner about the new customer.
    await sendAdminAlert(emailTemplates.adminNewUser(user));
  } catch (error) {
    console.error('Failed to send email verification:', error);
  }

  const accessToken = generateAccessToken({ id: user._id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user._id });

  await userRepository.findByIdAndUpdate(user._id, { refreshToken });

  return { user, accessToken, refreshToken };
};

export const login = async (email, password) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const accessToken = generateAccessToken({ id: user._id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user._id });

  await userRepository.findByIdAndUpdate(user._id, { refreshToken });

  return { user, accessToken, refreshToken };
};

// ================= Google Login Logic =================
export const googleLogin = async googleToken => {
  const response = await fetch(
    'https://www.googleapis.com/oauth2/v3/userinfo',
    {
      headers: { Authorization: `Bearer ${googleToken}` },
    },
  );

  if (!response.ok) {
    throw new AppError('Failed to fetch user info from Google', 400);
  }

  const googleUser = await response.json();

  if (!googleUser.email) {
    throw new AppError('Google Authentication failed: Email not provided', 400);
  }

  let user = await userRepository.findByEmail(googleUser.email);
  if (!user) {
    user = await userRepository.create({
      name: googleUser.name,
      email: googleUser.email,
      password: Math.random().toString(36).slice(-8) + 'Aa1@',
      isVerified: true,
    });
  }

  const accessToken = generateAccessToken({ id: user._id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user._id });

  await userRepository.findByIdAndUpdate(user._id, { refreshToken });

  return { user, accessToken, refreshToken };
};
// =======================================================

export const verifyEmail = async token => {
  const hashedToken = createHash('sha256').update(token).digest('hex');
  const user = await userRepository.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new AppError('Verification link is invalid or expired', 400);
  }

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  return { message: 'Email verified successfully' };
};

export const refreshAccessToken = async refreshToken => {
  if (!refreshToken) {
    throw new AppError('Refresh token is required', 401);
  }

  const decoded = verifyRefreshToken(refreshToken);
  const user = await userRepository.findById(decoded.id);

  if (!user || user.refreshToken !== refreshToken) {
    throw new AppError('Invalid refresh token', 401);
  }

  const accessToken = generateAccessToken({ id: user._id, role: user.role });

  return { accessToken };
};

export const logout = async userId => {
  await userRepository.findByIdAndUpdate(userId, { refreshToken: null });
};

export const forgotPassword = async email => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new AppError('No user found with this email', 404);
  }

  const resetToken = generateAccessToken({ id: user._id });
  const resetLink = `${config.frontendUrl}/reset-password?token=${resetToken}`;

  try {
    await sendEmail({
      to: user.email,
      ...emailTemplates.passwordReset(resetLink),
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
  }

  return { message: 'Password reset link sent to your email' };
};

export const resetPassword = async (token, newPassword) => {
  const decoded = verifyAccessToken(token);
  const user = await userRepository.findById(decoded.id);

  if (!user) {
    throw new AppError('Invalid token', 400);
  }

  user.password = newPassword;
  await user.save();

  return { message: 'Password reset successfully' };
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  user.password = newPassword;
  await user.save();

  return { message: 'Password changed successfully' };
};

export const getProfile = async userId => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user;
};

export const updateProfile = async (userId, data) => {
  const user = await userRepository.findByIdAndUpdate(userId, data, {
    new: true,
  });
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user;
};

export const updateAvatar = async (userId, file) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (!file) {
    throw new AppError('Avatar image is required', 400);
  }

  const uploaded = await uploadOnCloudinary(file.path);
  if (!uploaded?.secure_url) {
    throw new AppError('Failed to upload avatar image', 500);
  }

  const previousPublicId = user.avatar?.publicId;

  user.avatar = {
    publicId: uploaded.public_id,
    url: uploaded.secure_url,
  };
  await user.save();

  if (previousPublicId) {
    try {
      await deleteFromCloudinary(previousPublicId);
    } catch (error) {
      console.error('Failed to delete previous avatar:', error);
    }
  }

  return user;
};

export const getAddresses = async userId => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user.addresses;
};

export const addAddress = async (userId, data) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const makeDefault = data.isDefault || user.addresses.length === 0;
  if (makeDefault) {
    user.addresses.forEach(address => {
      address.isDefault = false;
    });
  }

  user.addresses.push({ ...data, isDefault: makeDefault });
  await user.save();

  return user.addresses;
};

export const updateAddress = async (userId, addressId, data) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const address = user.addresses.id(addressId);
  if (!address) {
    throw new AppError('Address not found', 404);
  }

  if (data.isDefault) {
    user.addresses.forEach(item => {
      item.isDefault = item._id.equals(address._id);
    });
  }

  Object.assign(address, data);
  await user.save();

  return user.addresses;
};

export const deleteAddress = async (userId, addressId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const address = user.addresses.id(addressId);
  if (!address) {
    throw new AppError('Address not found', 404);
  }

  const wasDefault = address.isDefault;
  address.deleteOne();

  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();

  return user.addresses;
};

export const setDefaultAddress = async (userId, addressId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const address = user.addresses.id(addressId);
  if (!address) {
    throw new AppError('Address not found', 404);
  }

  user.addresses.forEach(item => {
    item.isDefault = item._id.equals(address._id);
  });
  await user.save();

  return user.addresses;
};