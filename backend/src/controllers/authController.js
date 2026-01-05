import { authService } from '../services/authService.js';
import { logger } from '../utils/logger.js';

export const registerController = async (req, res) => {
  try {
    const { name, email, password } = req.validatedData;

    const user = await authService.register({ name, email, password });

    res.status(201).json({
      message: 'User registered successfully',
      user,
    });
  } catch (error) {
    logger.error('Register error', error);
    if (error.message.includes('already exists')) {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: 'Registration failed' });
  }
};

export const loginController = async (req, res) => {
  try {
    const { email, password } = req.validatedData;

    const result = await authService.login({ email, password });

    res.status(200).json({
      message: 'Login successful',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    logger.error('Login error', error);
    if (error.message.includes('Invalid')) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: 'Login failed' });
  }
};

export const getMeController = async (req, res) => {
  try {
    const user = await authService.getUser(req.userId);

    res.status(200).json({
      user,
    });
  } catch (error) {
    logger.error('GetMe error', error);
    res.status(404).json({ message: 'User not found' });
  }
};

export const searchUserByEmailController = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email query parameter is required' });
    }

    const user = await authService.searchUserByEmail(email);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    logger.error('Search user error', error);
    res.status(500).json({ message: 'Search failed' });
  }
};