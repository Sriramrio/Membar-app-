import { configureStore } from '@reduxjs/toolkit';
import orgReducer from './orgSlice';
import sessionReducer from './sessionSlice';

export const store = configureStore({
  reducer: {
    org: orgReducer,
    session: sessionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export * from './hooks';
