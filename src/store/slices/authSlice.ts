import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "../../lib/api";
import { TOKEN_KEY } from "../../../shared/constants";

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isLoading: false,
  isAuthenticated: false,
  error: null,
};

export const verifyPin = createAsyncThunk(
  "auth/verifyPin",
  async (pin: string, { rejectWithValue }) => {
    const response = await api.verifyPin(pin);
    if (response.error) {
      return rejectWithValue(response.error);
    }
    return response.data!;
  },
);

export const checkSession = createAsyncThunk(
  "auth/checkSession",
  async (_, { rejectWithValue }) => {
    const response = await api.checkAuth();
    if (response.error) {
      return rejectWithValue(response.error);
    }
    return response.data!;
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      localStorage.removeItem(TOKEN_KEY);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(verifyPin.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(verifyPin.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      localStorage.setItem(TOKEN_KEY, action.payload.token);
    });
    builder.addCase(verifyPin.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    builder.addCase(checkSession.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(checkSession.fulfilled, (state) => {
      state.isLoading = false;
      state.isAuthenticated = true;
    });
    builder.addCase(checkSession.rejected, (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      localStorage.removeItem(TOKEN_KEY);
    });
  },
});

export const { clearError, logout } = authSlice.actions;
export default authSlice.reducer;
