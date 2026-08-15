import { createSlice } from '@reduxjs/toolkit';
import api from '../services/api';

const initialUser = JSON.parse(localStorage.getItem('user')) || null;
const initialToken = localStorage.getItem('accessToken') || null;

const initialState = {
  user: initialUser,
  token: initialToken,
  isAuthenticated: !!initialToken,
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    authSuccess: (state, action) => {
      const { user, accessToken } = action.payload;
      state.loading = false;
      state.isAuthenticated = true;
      state.user = user;
      state.token = accessToken;
      state.error = null;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('accessToken', accessToken);
    },
    authFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logoutSuccess: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
    },
    updateProfileSuccess: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    }
  }
});

export const { authStart, authSuccess, authFailure, logoutSuccess, updateProfileSuccess } = authSlice.actions;

// Async Thunks using simple dispatch flow
export const loginWithOTPAction = (phone, otpCode) => async (dispatch) => {
  dispatch(authStart());
  try {
    const response = await api.post('/auth/login-otp', { phone, otpCode });
    if (response.data?.success) {
      dispatch(authSuccess({
        user: response.data.user,
        accessToken: response.data.accessToken
      }));
      return { success: true, role: response.data.user.role };
    }
  } catch (error) {
    const msg = error.response?.data?.message || 'Login verification failed.';
    dispatch(authFailure(msg));
    return { success: false, error: msg, registerRequired: error.response?.data?.registerRequired };
  }
};

export const registerWithOTPAction = (registerData) => async (dispatch) => {
  dispatch(authStart());
  try {
    const response = await api.post('/auth/register', registerData);
    if (response.data?.success) {
      dispatch(authSuccess({
        user: response.data.user,
        accessToken: response.data.accessToken
      }));
      return { success: true, tempPassword: response.data.tempPassword };
    }
  } catch (error) {
    const msg = error.response?.data?.message || 'Registration verification failed.';
    dispatch(authFailure(msg));
    return { success: false, error: msg };
  }
};

export const adminLoginAction = (username, password) => async (dispatch) => {
  dispatch(authStart());
  try {
    const response = await api.post('/auth/admin-login', { username, password });
    if (response.data?.success) {
      dispatch(authSuccess({
        user: response.data.user,
        accessToken: response.data.accessToken
      }));
      return { success: true, role: response.data.user.role };
    }
  } catch (error) {
    const msg = error.response?.data?.message || 'Login failed.';
    dispatch(authFailure(msg));
    return { success: false, error: msg };
  }
};

export const logoutAction = () => async (dispatch) => {
  try {
    await api.post('/auth/logout');
  } catch (err) {
    console.warn('Backend logout call failed, completing client-side logout.');
  } finally {
    dispatch(logoutSuccess());
  }
};

export const fetchMyProfileAction = () => async (dispatch) => {
  try {
    const response = await api.get('/auth/me');
    if (response.data?.success) {
      dispatch(updateProfileSuccess(response.data.user));
    }
  } catch (error) {
    console.error('Failed to sync user profile:', error.message);
  }
};

export const loginWithPasswordAction = (identifier, password) => async (dispatch) => {
  dispatch(authStart());
  try {
    const response = await api.post('/auth/login-password', { identifier, password });
    if (response.data?.success) {
      dispatch(authSuccess({
        user: response.data.user,
        accessToken: response.data.accessToken
      }));
      return { success: true, role: response.data.user.role };
    }
  } catch (error) {
    const msg = error.response?.data?.message || 'Login failed.';
    dispatch(authFailure(msg));
    return { success: false, error: msg };
  }
};

export const registerWithPasswordAction = (registerData) => async (dispatch) => {
  dispatch(authStart());
  try {
    const response = await api.post('/auth/register-password', registerData);
    if (response.data?.success) {
      dispatch(authSuccess({
        user: response.data.user,
        accessToken: response.data.accessToken
      }));
      return { success: true };
    }
  } catch (error) {
    const msg = error.response?.data?.message || 'Registration failed.';
    dispatch(authFailure(msg));
    return { success: false, error: msg };
  }
};

export const loginWithGoogleAction = (googleData) => async (dispatch) => {
  dispatch(authStart());
  try {
    const response = await api.post('/auth/google', googleData);
    if (response.data?.success) {
      dispatch(authSuccess({
        user: response.data.user,
        accessToken: response.data.accessToken
      }));
      return { success: true };
    } else {
      dispatch(authFailure(response.data?.message || 'Google account not registered.'));
      return { 
        success: false, 
        registerRequired: response.data?.registerRequired, 
        email: response.data?.email, 
        name: response.data?.name 
      };
    }
  } catch (error) {
    const msg = error.response?.data?.message || 'Google authentication failed.';
    dispatch(authFailure(msg));
    return { success: false, error: msg };
  }
};

export const loginWithFirebaseAction = (firebaseToken) => async (dispatch) => {
  dispatch(authStart());
  try {
    const response = await api.post('/auth/firebase-login', { firebaseToken });
    if (response.data?.success) {
      dispatch(authSuccess({
        user: response.data.user,
        accessToken: response.data.accessToken
      }));
      return { success: true };
    } else {
      dispatch(authFailure(response.data?.message || 'Firebase login failed.'));
      return { 
        success: false, 
        registerRequired: response.data?.registerRequired, 
        phone: response.data?.phone 
      };
    }
  } catch (error) {
    const msg = error.response?.data?.message || 'Firebase authentication failed.';
    dispatch(authFailure(msg));
    return { success: false, error: msg };
  }
};

export const registerWithFirebaseAction = (registerData) => async (dispatch) => {
  dispatch(authStart());
  try {
    const response = await api.post('/auth/firebase-register', registerData);
    if (response.data?.success) {
      dispatch(authSuccess({
        user: response.data.user,
        accessToken: response.data.accessToken
      }));
      return { success: true };
    }
  } catch (error) {
    const msg = error.response?.data?.message || 'Firebase registration failed.';
    dispatch(authFailure(msg));
    return { success: false, error: msg };
  }
};

export default authSlice.reducer;
