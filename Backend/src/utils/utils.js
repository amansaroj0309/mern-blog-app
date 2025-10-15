import User from '../models/user.model.js';
import customError from './customErrorHandler.js';

export const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        console.log(error.message);
        new customError(500, error.message);
    }
};

export const accessTokenOptions = {
    httpOnly: true,
    sameSite: 'lax', // Changed from 'none' to 'lax' for HTTP compatibility
    secure: false, // Set to false for HTTP, true only if using HTTPS
    maxAge: 86400000, // 1 day
    path: '/',
};

export const refreshTokenOptions = {
    httpOnly: true,
    sameSite: 'lax', // Changed from 'none' to 'lax' for HTTP compatibility
    secure: false, // Set to false for HTTP, true only if using HTTPS
    maxAge: 864000000, // 10 days
    path: '/',
};
