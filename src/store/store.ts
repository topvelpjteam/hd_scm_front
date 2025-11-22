import { configureStore } from '@reduxjs/toolkit';
import tabReducer from './tabSlice';
import authReducer from './authSlice';
import codeListReducer from './codeListSlice';
import tabStateReducer from './tabStateSlice';
import menuReducer from './menuSlice';
import productRegistrationReducer from './productRegistrationSlice';
import agentRegistrationReducer from './agentRegistrationSlice';
import userManagementReducer from './userManagementSlice';
import menuManagementReducer from './menuManagementSlice';
import orderRegistrationReducer from './orderRegistrationSlice';
import orderListManagementReducer from './orderListManagementSlice';
import orderConfirmReducer from './orderConfirmSlice';
import agentStockReducer from './agentStockSlice';
import tradeStatusReducer from './tradeStatusSlice';
import custRegistrationReducer from './custRegistrationSlice';
import salesRegistrationReducer from './salesRegistrationSlice';

export const store = configureStore({
  reducer: {
    tabs: tabReducer,
    auth: authReducer,
    codeList: codeListReducer,
    tabState: tabStateReducer,
    menu: menuReducer,
    productRegistration: productRegistrationReducer,
    agentRegistration: agentRegistrationReducer,
    custRegistration: custRegistrationReducer,
    salesRegistration: salesRegistrationReducer,
    userManagement: userManagementReducer,
    menuManagement: menuManagementReducer,
    orderRegistration: orderRegistrationReducer,
    orderListManagement: orderListManagementReducer,
    orderConfirm: orderConfirmReducer,
    agentStock: agentStockReducer,
    tradeStatus: tradeStatusReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
