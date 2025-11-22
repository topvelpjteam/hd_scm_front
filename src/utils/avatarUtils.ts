/**
 * 사용자 성별에 따른 아바타 이미지 경로를 반환하는 유틸리티 함수
 * @param userGender - 사용자 성별 ('F' 또는 기타)
 * @returns 아바타 이미지 경로
 */
export const getAvatarImagePath = (userGender?: string): string => {
  // user_gender가 'F'인 경우 f.png 사용, 그 외에는 기본 아바타 사용
  if (userGender === 'F') {
    return '/images/avatars/f.png';
  }
  return '/images/avatars/default-avatar.png';
};

/**
 * 사용자 이름의 첫 글자를 추출하는 함수
 * @param userName - 사용자 이름
 * @returns 사용자 이름의 첫 글자
 */
export const getUserInitials = (userName: string): string => {
  if (!userName || userName.trim() === '') {
    return 'U'; // 기본값
  }
  
  // 공백으로 분리하여 첫 번째 단어의 첫 글자 반환
  const words = userName.trim().split(' ');
  return words[0].charAt(0).toUpperCase();
};
