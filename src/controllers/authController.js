import { asyncHandler, sendResponse } from '../utils/index.js';
import * as authService from '../services/index.js';
import { config } from '../config/index.js';

const setCookieOptions = {
  httpOnly: config.cookie.httpOnly,
  secure: config.cookie.secure,
  sameSite: config.cookie.sameSite,
  maxAge: 7 * 24 * 60 * 60 * 1000
};

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.cookie('refreshToken', result.refreshToken, setCookieOptions);
  res.cookie('accessToken', result.accessToken, { ...setCookieOptions, maxAge: 15 * 60 * 1000 });
  sendResponse(res, {
    message: 'User registered successfully',
    data: { user: result.user, accessToken: result.accessToken },
    statusCode: 201
  });
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body.email, req.body.password);
  res.cookie('refreshToken', result.refreshToken, setCookieOptions);
  res.cookie('accessToken', result.accessToken, { ...setCookieOptions, maxAge: 15 * 60 * 1000 });
  sendResponse(res, {
    message: 'Login successful',
    data: { user: result.user, accessToken: result.accessToken }
  });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmail(req.params.token);
  sendResponse(res, result);
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const result = await authService.refreshAccessToken(req.cookies.refreshToken);
  res.cookie('accessToken', result.accessToken, { ...setCookieOptions, maxAge: 15 * 60 * 1000 });
  sendResponse(res, {
    message: 'Access token refreshed',
    data: result
  });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id);
  res.clearCookie('refreshToken');
  res.clearCookie('accessToken');
  sendResponse(res, { message: 'Logout successful' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  sendResponse(res, result);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.params.token, req.body.password);
  sendResponse(res, result);
});

export const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(
    req.user._id,
    req.body.currentPassword,
    req.body.newPassword
  );
  sendResponse(res, result);
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user._id);
  sendResponse(res, { data: user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user._id, req.body);
  sendResponse(res, { message: 'Profile updated successfully', data: user });
});

// ================= Google Login Controller =================
export const googleLogin = asyncHandler(async (req, res) => {
  const result = await authService.googleLogin(req.body.token);
  
  res.cookie('refreshToken', result.refreshToken, setCookieOptions);
  res.cookie('accessToken', result.accessToken, { ...setCookieOptions, maxAge: 15 * 60 * 1000 });
  
  sendResponse(res, {
    message: 'Google Login successful',
    data: { user: result.user, accessToken: result.accessToken }
  });
});