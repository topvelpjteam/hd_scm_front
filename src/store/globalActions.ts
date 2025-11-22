import { createAction } from '@reduxjs/toolkit';

// 전체 상태 초기화를 위한 글로벌 액션
export const resetAllStates = createAction('global/resetAllStates');

// 브라우저 종료 시 상태 정리를 위한 액션
export const clearAllData = createAction('global/clearAllData');
