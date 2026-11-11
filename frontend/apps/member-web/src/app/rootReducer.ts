import { combineReducers } from '@reduxjs/toolkit';
import auth from '@/features/auth/authSlice';
import network from '@/features/network/networkSlice';
import operations from '@/features/operations/operationsSlice';
import platformRuntime from '@/features/platform-runtime/platformRuntimeSlice';
import controlPlane from '@/features/control-plane/controlPlaneSlice';
import memberNavigation from '@/features/member/navigation/memberNavigationSlice';

export const rootReducer = combineReducers({ auth, network, operations, platformRuntime, controlPlane, memberNavigation });
