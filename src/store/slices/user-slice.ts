
import { createSlice, PayloadAction, createAction } from "@reduxjs/toolkit";

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

export const appLogout = createAction('app/logout');

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
  },
});

export const { setUser } = userSlice.actions;
export default userSlice.reducer;
