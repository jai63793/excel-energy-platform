/**
 * Standard request validation middleware factory
 */
export const validateBody = (rules) => {
  return (req, res, next) => {
    const errors = [];
    const fields = Object.keys(rules);

    for (const field of fields) {
      const value = req.body[field];
      const rule = rules[field];

      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`Field '${field}' is required.`);
        continue;
      }

      if (value !== undefined && value !== null && value !== '') {
        if (rule.type && typeof value !== rule.type) {
          errors.push(`Field '${field}' must be of type '${rule.type}'.`);
        }

        if (rule.regex && !rule.regex.test(value)) {
          errors.push(`Field '${field}' format is invalid.`);
        }

        if (rule.minLength && value.toString().length < rule.minLength) {
          errors.push(`Field '${field}' must have at least ${rule.minLength} characters.`);
        }

        if (rule.maxLength && value.toString().length > rule.maxLength) {
          errors.push(`Field '${field}' must have at most ${rule.maxLength} characters.`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors, message: 'Validation failed.' });
    }

    next();
  };
};

// Common Validation Schemas
export const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 phone format
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegister = validateBody({
  name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
  phone: { required: true, type: 'string', regex: phoneRegex },
  email: { required: false, type: 'string', regex: emailRegex },
  address: { required: false, type: 'string' }
});

export const validateOTPRequest = validateBody({
  phone: { required: true, type: 'string', regex: phoneRegex }
});

export const validateOTPVerify = validateBody({
  phone: { required: true, type: 'string', regex: phoneRegex },
  otpCode: { required: true, type: 'string', minLength: 6, maxLength: 6 }
});

export const validateContactForm = validateBody({
  name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
  email: { required: false, type: 'string', regex: emailRegex },
  phone: { required: true, type: 'string', regex: phoneRegex },
  message: { required: true, type: 'string', minLength: 5 }
});

export const validateAdminLogin = validateBody({
  username: { required: true, type: 'string' },
  password: { required: true, type: 'string' }
});

export const validatePasswordRegister = validateBody({
  name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
  phone: { required: true, type: 'string', regex: phoneRegex },
  password: { required: true, type: 'string', minLength: 6 },
  otpCode: { required: true, type: 'string', minLength: 6, maxLength: 6 },
  email: { required: false, type: 'string', regex: emailRegex },
  address: { required: false, type: 'string' },
  profilePhoto: { required: false, type: 'string' }
});

export const validatePasswordLogin = validateBody({
  identifier: { required: true, type: 'string', minLength: 2 },
  password: { required: true, type: 'string' }
});

export const validateGoogleAuth = validateBody({
  email: { required: true, type: 'string', regex: emailRegex },
  name: { required: true, type: 'string' }
});

export const validateFirebaseLogin = validateBody({
  firebaseToken: { required: true, type: 'string' }
});

export const validateFirebaseRegister = validateBody({
  firebaseToken: { required: true, type: 'string' },
  name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
  email: { required: false, type: 'string', regex: emailRegex },
  address: { required: false, type: 'string' }
});

export const validateForgotPasswordRequest = validateBody({
  phone: { required: true, type: 'string', regex: phoneRegex }
});

export const validateForgotPasswordReset = validateBody({
  phone: { required: true, type: 'string', regex: phoneRegex },
  otpCode: { required: true, type: 'string', minLength: 6, maxLength: 6 },
  newPassword: { required: true, type: 'string', minLength: 6 }
});
