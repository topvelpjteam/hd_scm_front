import { useSelector, useDispatch } from 'react-redux';
import { useMemo } from 'react';
import { RootState } from '../store/store';
import { updateTabState, updateTabStates, resetTabState } from '../store/tabStateSlice';

// 탭 상태를 관리하는 커스텀 훅
export const useTabState = (tabId: string) => {
  const dispatch = useDispatch();
  
  // 현재 탭의 상태 가져오기 (메모이제이션 적용)
  const tabState = useSelector((state: RootState) => {
    const stateData = state.tabState[tabId];
    // null 대신 undefined를 반환하여 일관성 유지
    return stateData !== undefined ? stateData : undefined;
  });
  
  // 메모이제이션된 상태 객체
  const memoizedState = useMemo(() => {
    return tabState !== undefined ? tabState : {};
  }, [tabState]);
  
  // 단일 상태 업데이트
  const setState = (key: string, value: any) => {
    dispatch(updateTabState({ tabId, key, value }));
  };
  
  // 여러 상태 한 번에 업데이트
  const setStates = (states: { [key: string]: any }) => {
    dispatch(updateTabStates({ tabId, states }));
  };
  
  // 탭 상태 초기화
  const resetState = () => {
    dispatch(resetTabState(tabId));
  };
  
  return {
    state: memoizedState,
    setState,
    setStates,
    resetState
  };
};

// 특정 키의 상태만 가져오는 훅
export const useTabStateValue = (tabId: string, key: string, defaultValue?: any) => {
  const { state, setState } = useTabState(tabId);
  
  // 메모이제이션된 값
  const memoizedValue = useMemo(() => {
    return state[key] !== undefined ? state[key] : defaultValue;
  }, [state, key, defaultValue]);
  
  // 메모이제이션된 setter 함수
  const memoizedSetter = useMemo(() => {
    return (value: any) => setState(key, value);
  }, [setState, key]);
  
  return [memoizedValue, memoizedSetter] as const;
};
