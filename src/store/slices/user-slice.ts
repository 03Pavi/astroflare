
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserInfo {
  uid: string | null;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface UserState extends UserInfo {
  isAuthenticated: boolean;
}

const initialState: UserState = {
  uid: null,
  email: null,
  displayName: null,
  photoURL: null,
  isAuthenticated: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserInfo>) => {
      state.uid = action.payload.uid;
      state.email = action.payload.email;
      state.displayName = action.payload.displayName;
      state.photoURL = action.payload.photoURL;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.uid = null;
      state.email = null;
      state.displayName = null;
      state.photoURL = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, logout } = userSlice.actions;
export default userSlice.reducer;
