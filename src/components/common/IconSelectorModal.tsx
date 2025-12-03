import React, { useState, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { X, Search, HelpCircle } from 'lucide-react';
import './IconSelectorModal.css';

// 사용 가능한 아이콘 이름 목록 (kebab-case)
// lucide-react에 없는 아이콘도 추가 가능 - 자동으로 fallback 처리됨
const iconNames: string[] = [
  // 기본 아이콘들
  'home', 'user', 'users', 'settings', 'search', 'plus', 'edit', 'trash-2', 'save', 'download', 'upload',
  
  // 비즈니스 아이콘들
  'layout-dashboard', 'bar-chart-3', 'bar-chart', 'bar-chart-2', 'bar-chart-4', 'pie-chart', 'line-chart',
  'trending-up', 'trending-down', 'dollar-sign', 'credit-card', 'package',
  'briefcase', 'building', 'building-2', 'factory', 'warehouse', 'store',
  'receipt', 'banknote', 'coins', 'wallet', 'calculator', 'percent',
  'clipboard-list', 'clipboard-check', 'clipboard-copy',
  'target', 'award', 'trophy', 'crown', 'gem', 'gift',
  'user-check', 'user-cog', 'user-plus', 'user-minus', 'user-x',
  'layers', 'box', 'git-branch', 'network',
  
  // 금융/비즈니스 확장
  'landmark', 'scale', 'gauge', 'timer', 'hourglass', 'alarm-clock',
  'file-bar-chart', 'file-spreadsheet', 'file-pie-chart',
  'table', 'table-2', 'kanban', 'layout-list', 'layout-grid',
  'badge-percent', 'ticket', 'shopping-bag', 'shopping-cart',
  
  // 파일 및 문서
  'file', 'folder', 'folder-open', 'archive', 'copy', 'file-text', 'book', 'book-open',
  'file-plus', 'file-check', 'file-minus', 'file-x', 'files',
  'folder-plus', 'folder-minus', 'folder-x', 'folders', 'folder-archive',
  'file-input', 'file-output', 'inbox',
  
  // UI 및 네비게이션
  'menu', 'grid', 'list', 'filter', 'sort-asc', 'sort-desc', 'more-horizontal', 'more-vertical',
  'combine', 'split', 'merge', 'replace', 'scissors',
  
  // 편집/텍스트
  'pen-tool', 'pencil', 'eraser', 'highlighter', 'type',
  'align-left', 'align-center', 'align-right', 'align-justify',
  'bold', 'italic', 'underline', 'strikethrough',
  'list-ordered', 'list-minus', 'list-plus', 'check-square', 'square',
  'circle', 'circle-dot', 'disc', 'radio', 'hash', 'at-sign', 'asterisk', 'command', 'option',
  
  // 방향 및 화살표
  'chevron-down', 'chevron-up', 'chevron-left', 'chevron-right',
  'chevrons-up', 'chevrons-down', 'chevrons-left', 'chevrons-right',
  'arrow-up', 'arrow-down', 'arrow-left', 'arrow-right',
  'arrow-up-right', 'arrow-up-left', 'arrow-down-right', 'arrow-down-left',
  'move-up', 'move-down', 'move-left', 'move-right', 'move',
  'corner-down-left', 'corner-down-right', 'corner-up-left', 'corner-up-right',
  
  // 상태 및 알림
  'alert-circle', 'check-circle', 'x-circle', 'info', 'help-circle', 'star', 'heart', 'bookmark', 'bell', 'check',
  'alert-triangle', 'alert-octagon', 'shield-alert', 'bell-ring', 'bell-off',
  'plus-circle', 'minus-circle',
  
  // 보안 및 권한
  'lock', 'unlock', 'shield', 'shield-check', 'shield-off', 'key', 'key-round', 'fingerprint', 'scan-face',
  
  // 통신 및 메시지
  'mail', 'phone', 'message-square', 'send', 'paperclip',
  'mail-open', 'mail-plus', 'mail-minus', 'mail-x', 'mail-check',
  'phone-call', 'phone-incoming', 'phone-outgoing', 'phone-missed', 'phone-off',
  'message-circle', 'messages-square',
  
  // 미디어
  'image', 'camera', 'video', 'video-off', 'mic', 'mic-off', 'volume-2', 'volume-x', 'headphones', 'speaker',
  'image-plus', 'image-minus', 'images', 'film', 'clapperboard',
  'volume', 'volume-1', 'music', 'music-2', 'music-3', 'music-4',
  
  // 재생 컨트롤
  'play', 'pause', 'skip-back', 'skip-forward', 'repeat', 'shuffle',
  'play-circle', 'pause-circle', 'stop-circle', 'fast-forward', 'rewind', 'repeat-1', 'repeat-2',
  
  // 하드웨어 및 기술
  'printer', 'qr-code', 'barcode', 'smartphone', 'tablet', 'laptop', 'monitor',
  'cpu', 'hard-drive', 'server', 'router', 'cable',
  'mouse', 'keyboard', 'gamepad', 'gamepad-2', 'watch',
  
  // 네트워크 및 연결
  'wifi', 'wifi-off', 'globe', 'link', 'external-link', 'link-2', 'link-2-off', 'unlink', 'unlink-2', 'share-2',
  'cloud', 'cloud-off', 'cloud-rain', 'cloud-snow', 'cloud-sun', 'upload-cloud', 'download-cloud',
  
  // 전원 및 제어
  'power', 'power-off', 'zap', 'toggle-left', 'toggle-right',
  'battery-charging', 'battery-full', 'battery-low', 'battery-medium', 'battery-warning',
  'plug', 'plug-zap', 'outlet',
  
  // 날씨 및 자연
  'sun', 'moon', 'wind', 'thermometer', 'droplets', 'flame', 'umbrella',
  'sunrise', 'sunset', 'cloud-lightning', 'snowflake', 'waves',
  'leaf', 'tree-deciduous', 'tree-pine', 'flower', 'flower-2', 'mountain', 'mountain-snow',
  
  // 동물
  'bug', 'fish', 'bird', 'cat', 'dog', 'rat', 'rabbit', 'squirrel', 'turtle', 'snail',
  
  // 감정 및 반응
  'hand', 'thumbs-up', 'thumbs-down', 'smile', 'frown', 'laugh', 'meh', 'angry', 'smile-plus', 'heart-crack',
  'party-popper', 'sparkles', 'stars', 'rocket',
  
  // 기타 유용한 아이콘들
  'tag', 'tags', 'flag', 'share', 'refresh-cw', 'rotate-ccw', 'rotate-cw',
  'zoom-in', 'zoom-out', 'maximize', 'minimize',
  'battery', 'calendar', 'clock', 'map-pin', 'truck', 'database', 'eye', 'eye-off', 'code', 'activity',
  'log-in', 'log-out', 'cog', 'sliders', 'wrench', 'hammer', 'history',
  'compass', 'map', 'navigation', 'navigation-2', 'locate', 'crosshair', 'focus', 'scan', 'scan-line',
  
  // 추가로 원하는 아이콘들 (존재하지 않아도 에러 없음)
  'handshake', 'piggy-bank', 'blocks', 'medal', 'badge-check', 'layers-2', 'layers-3',
  'file-plus-2', 'file-check-2', 'component', 'chart-area', 'chart-bar', 'chart-line',
];

// kebab-case를 PascalCase로 변환
const toPascalCase = (str: string): string => {
  return str
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
};

// 아이콘 컴포넌트 가져오기 (없으면 null 반환)
const getIconComponent = (iconName: string): React.ComponentType<{ size?: number }> | null => {
  const pascalName = toPascalCase(iconName);
  const IconComponent = (LucideIcons as Record<string, unknown>)[pascalName];
  
  // ESM/CommonJS 호환: function 또는 object(forwardRef) 모두 처리
  if (IconComponent && (typeof IconComponent === 'function' || typeof IconComponent === 'object')) {
    return IconComponent as React.ComponentType<{ size?: number }>;
  }
  return null;
};

// Fallback 아이콘 컴포넌트
const FallbackIcon: React.FC<{ size?: number; name: string }> = ({ size = 20, name }) => (
  <div 
    style={{ 
      width: size, 
      height: size, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      border: '1px dashed #ccc',
      borderRadius: 4,
      fontSize: 8,
      color: '#999',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }}
    title={`${name} (아이콘 없음)`}
  >
    ?
  </div>
);

// 아이콘 목록 생성 (존재하는 것만 + fallback 표시)
const createIconList = () => {
  const validIcons: Array<{ name: string; component: React.ComponentType<{ size?: number }>; exists: boolean }> = [];
  const invalidIcons: Array<{ name: string; component: React.ComponentType<{ size?: number }>; exists: boolean }> = [];
  
  iconNames.forEach(name => {
    const component = getIconComponent(name);
    if (component) {
      validIcons.push({ name, component, exists: true });
    } else {
      // Fallback 컴포넌트 생성
      const FallbackComponent: React.FC<{ size?: number }> = (props) => <FallbackIcon {...props} name={name} />;
      invalidIcons.push({ name, component: FallbackComponent, exists: false });
    }
  });
  
  // 존재하는 아이콘 먼저, 그 다음 없는 아이콘들
  return [...validIcons, ...invalidIcons];
};

const allIcons = createIconList();

interface IconSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (iconName: string) => void;
  currentIcon?: string;
}

const IconSelectorModal: React.FC<IconSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentIcon
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyValid, setShowOnlyValid] = useState(true);

  const filteredIcons = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    let icons = allIcons;
    
    // 유효한 아이콘만 필터링
    if (showOnlyValid) {
      icons = icons.filter(icon => icon.exists);
    }
    
    if (!search) return icons;
    
    return icons.filter(icon =>
      icon.name.toLowerCase().includes(search)
    );
  }, [searchTerm, showOnlyValid]);

  const handleIconSelect = (iconName: string) => {
    onSelect(iconName);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const validCount = allIcons.filter(i => i.exists).length;
  const invalidCount = allIcons.filter(i => !i.exists).length;

  return (
    <div 
      className="icon-selector-modal-backdrop"
      onClick={handleBackdropClick}
    >
      <div className="icon-selector-modal">
        {/* 헤더 */}
        <div className="icon-selector-header">
          <h3>아이콘 선택</h3>
          <button 
            className="icon-selector-close-btn"
            onClick={onClose}
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        {/* 검색 바 */}
        <div className="icon-selector-search">
          <div className="icon-selector-search-input-wrapper">
            <Search size={16} className="icon-selector-search-icon" />
            <input
              type="text"
              placeholder="아이콘 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="icon-selector-search-input"
              autoFocus
            />
          </div>
          <label className="icon-selector-filter-label">
            <input
              type="checkbox"
              checked={showOnlyValid}
              onChange={(e) => setShowOnlyValid(e.target.checked)}
            />
            <span>유효한 아이콘만 ({validCount}개)</span>
          </label>
        </div>

        {/* 아이콘 그리드 */}
        <div className="icon-selector-content">
          <div className="icon-selector-grid">
            {filteredIcons.map(({ name, component: IconComponent, exists }) => (
              <button
                key={name}
                className={`icon-selector-item ${currentIcon === name ? 'selected' : ''} ${!exists ? 'invalid' : ''}`}
                onClick={() => handleIconSelect(name)}
                title={exists ? name : `${name} (미지원 아이콘)`}
              >
                <IconComponent size={20} />
                <span className="icon-selector-item-name">{name}</span>
              </button>
            ))}
          </div>

          {filteredIcons.length === 0 && (
            <div className="icon-selector-no-results">
              <p>검색 결과가 없습니다.</p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="icon-selector-footer">
          <p className="icon-selector-count">
            총 {filteredIcons.length}개의 아이콘
            {!showOnlyValid && invalidCount > 0 && (
              <span className="icon-selector-invalid-info">
                <HelpCircle size={12} />
                미지원 {invalidCount}개 포함
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default IconSelectorModal;
