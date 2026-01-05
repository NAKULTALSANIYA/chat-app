import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const chatSchema = Joi.object({
  memberId: Joi.string().required().length(24), // MongoDB ObjectId length
});

export const messageSchema = Joi.object({
  chatId: Joi.string().required().length(24),
  text: Joi.string().min(1).max(5000).required().trim(),
});

export const validateRequest = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const messages = error.details.map((d) => d.message).join(', ');
    return res.status(400).json({ message: 'Validation error', details: messages });
  }

  req.validatedData = value;
  next();
};