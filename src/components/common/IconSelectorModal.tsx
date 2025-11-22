import React, { useState, useMemo } from 'react';
import { 
  X, Search,
  // 기본 아이콘들
  Home, User, Users, Settings, Plus, Edit, Trash2, Save, Download, Upload,
  // 비즈니스 아이콘들
  LayoutDashboard, BarChart3, PieChart, TrendingUp, TrendingDown, DollarSign, CreditCard, Package,
  // 파일 및 문서
  File, Folder, FolderOpen, Archive, Copy, FileText, Book, BookOpen,
  // UI 및 네비게이션
  Menu, Grid, List, Filter, SortAsc, SortDesc, MoreHorizontal, MoreVertical,
  // 방향 및 화살표
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  // 상태 및 알림
  AlertCircle, CheckCircle, XCircle, Info, HelpCircle, Star, Heart, Bookmark, Bell, Check,
  // 보안 및 권한
  Lock, Unlock, Shield, ShieldCheck, Key,
  // 통신 및 메시지
  Mail, Phone, MessageSquare, Send, Paperclip,
  // 미디어
  Image, Camera, Video, VideoOff, Mic, MicOff, Volume2, VolumeX, Headphones, Speaker,
  // 재생 컨트롤
  Play, Pause, SkipBack, SkipForward, Repeat, Shuffle,
  // 하드웨어 및 기술
  Printer, QrCode, Smartphone, Tablet, Laptop, Monitor,
  // 네트워크 및 연결
  Wifi, WifiOff, Globe, Link, ExternalLink,
  // 전원 및 제어
  Power, PowerOff, Zap, ToggleLeft, ToggleRight,
  // 날씨 및 자연
  Sun, Moon, Cloud, Wind, Thermometer, Droplets, Flame, Umbrella,
  // 동물
  Bug, Fish, Bird, Cat, Dog,
  // 감정 및 반응
  Hand, ThumbsUp, ThumbsDown, Smile, Frown,
  // 기타 유용한 아이콘들
  Tag, Tags, Flag, Share, RefreshCw, RotateCcw, RotateCw, ZoomIn, ZoomOut, Maximize, Minimize,
  Battery, Calendar, Clock, MapPin, ShoppingCart, Truck, Database, Eye, Code, Activity,
  UserPlus, UserMinus, LogIn, LogOut, Cog, Sliders, Wrench, Hammer, LineChart, History
} from 'lucide-react';
import './IconSelectorModal.css';

// 아이콘 목록 정의
const iconList = [
  // 기본 아이콘들
  { name: 'home', component: Home },
  { name: 'user', component: User },
  { name: 'users', component: Users },
  { name: 'settings', component: Settings },
  { name: 'search', component: Search },
  { name: 'plus', component: Plus },
  { name: 'edit', component: Edit },
  { name: 'trash-2', component: Trash2 },
  { name: 'save', component: Save },
  { name: 'download', component: Download },
  { name: 'upload', component: Upload },
  
  // 비즈니스 아이콘들
  { name: 'layout-dashboard', component: LayoutDashboard },
  { name: 'bar-chart-3', component: BarChart3 },
  { name: 'pie-chart', component: PieChart },
  { name: 'trending-up', component: TrendingUp },
  { name: 'trending-down', component: TrendingDown },
  { name: 'dollar-sign', component: DollarSign },
  { name: 'credit-card', component: CreditCard },
  { name: 'package', component: Package },
  
  // 파일 및 문서
  { name: 'file', component: File },
  { name: 'folder', component: Folder },
  { name: 'folder-open', component: FolderOpen },
  { name: 'archive', component: Archive },
  { name: 'copy', component: Copy },
  { name: 'file-text', component: FileText },
  { name: 'book', component: Book },
  { name: 'book-open', component: BookOpen },
  
  // UI 및 네비게이션
  { name: 'menu', component: Menu },
  { name: 'grid', component: Grid },
  { name: 'list', component: List },
  { name: 'filter', component: Filter },
  { name: 'sort-asc', component: SortAsc },
  { name: 'sort-desc', component: SortDesc },
  { name: 'more-horizontal', component: MoreHorizontal },
  { name: 'more-vertical', component: MoreVertical },
  
  // 방향 및 화살표
  { name: 'chevron-down', component: ChevronDown },
  { name: 'chevron-up', component: ChevronUp },
  { name: 'chevron-left', component: ChevronLeft },
  { name: 'chevron-right', component: ChevronRight },
  { name: 'arrow-up', component: ArrowUp },
  { name: 'arrow-down', component: ArrowDown },
  { name: 'arrow-left', component: ArrowLeft },
  { name: 'arrow-right', component: ArrowRight },
  
  // 상태 및 알림
  { name: 'alert-circle', component: AlertCircle },
  { name: 'check-circle', component: CheckCircle },
  { name: 'x-circle', component: XCircle },
  { name: 'info', component: Info },
  { name: 'help-circle', component: HelpCircle },
  { name: 'star', component: Star },
  { name: 'heart', component: Heart },
  { name: 'bookmark', component: Bookmark },
  { name: 'bell', component: Bell },
  { name: 'check', component: Check },
  { name: 'x', component: X },
  
  // 보안 및 권한
  { name: 'lock', component: Lock },
  { name: 'unlock', component: Unlock },
  { name: 'shield', component: Shield },
  { name: 'shield-check', component: ShieldCheck },
  { name: 'key', component: Key },
  
  // 통신 및 메시지
  { name: 'mail', component: Mail },
  { name: 'phone', component: Phone },
  { name: 'message-square', component: MessageSquare },
  { name: 'send', component: Send },
  { name: 'paperclip', component: Paperclip },
  
  // 미디어
  { name: 'image', component: Image },
  { name: 'camera', component: Camera },
  { name: 'video', component: Video },
  { name: 'video-off', component: VideoOff },
  { name: 'mic', component: Mic },
  { name: 'mic-off', component: MicOff },
  { name: 'volume-2', component: Volume2 },
  { name: 'volume-x', component: VolumeX },
  { name: 'headphones', component: Headphones },
  { name: 'speaker', component: Speaker },
  
  // 재생 컨트롤
  { name: 'play', component: Play },
  { name: 'pause', component: Pause },
  { name: 'skip-back', component: SkipBack },
  { name: 'skip-forward', component: SkipForward },
  { name: 'repeat', component: Repeat },
  { name: 'shuffle', component: Shuffle },
  
  // 하드웨어 및 기술
  { name: 'printer', component: Printer },
  { name: 'qr-code', component: QrCode },
  { name: 'smartphone', component: Smartphone },
  { name: 'tablet', component: Tablet },
  { name: 'laptop', component: Laptop },
  { name: 'monitor', component: Monitor },
  
  // 네트워크 및 연결
  { name: 'wifi', component: Wifi },
  { name: 'wifi-off', component: WifiOff },
  { name: 'globe', component: Globe },
  { name: 'link', component: Link },
  { name: 'external-link', component: ExternalLink },
  
  // 전원 및 제어
  { name: 'power', component: Power },
  { name: 'power-off', component: PowerOff },
  { name: 'zap', component: Zap },
  { name: 'toggle-left', component: ToggleLeft },
  { name: 'toggle-right', component: ToggleRight },
  
  // 날씨 및 자연
  { name: 'sun', component: Sun },
  { name: 'moon', component: Moon },
  { name: 'cloud', component: Cloud },
  { name: 'wind', component: Wind },
  { name: 'thermometer', component: Thermometer },
  { name: 'droplets', component: Droplets },
  { name: 'flame', component: Flame },
  { name: 'umbrella', component: Umbrella },
  
  // 동물
  { name: 'bug', component: Bug },
  { name: 'fish', component: Fish },
  { name: 'bird', component: Bird },
  { name: 'cat', component: Cat },
  { name: 'dog', component: Dog },
  
  // 감정 및 반응
  { name: 'hand', component: Hand },
  { name: 'thumbs-up', component: ThumbsUp },
  { name: 'thumbs-down', component: ThumbsDown },
  { name: 'smile', component: Smile },
  { name: 'frown', component: Frown },
  
  // 기타 유용한 아이콘들
  { name: 'tag', component: Tag },
  { name: 'tags', component: Tags },
  { name: 'flag', component: Flag },
  { name: 'share', component: Share },
  { name: 'refresh-cw', component: RefreshCw },
  { name: 'rotate-ccw', component: RotateCcw },
  { name: 'rotate-cw', component: RotateCw },
  { name: 'zoom-in', component: ZoomIn },
  { name: 'zoom-out', component: ZoomOut },
  { name: 'maximize', component: Maximize },
  { name: 'minimize', component: Minimize },
  { name: 'battery', component: Battery },
  { name: 'calendar', component: Calendar },
  { name: 'clock', component: Clock },
  { name: 'map-pin', component: MapPin },
  { name: 'shopping-cart', component: ShoppingCart },
  { name: 'truck', component: Truck },
  { name: 'database', component: Database },
  { name: 'eye', component: Eye },
  { name: 'code', component: Code },
  { name: 'activity', component: Activity },
  { name: 'user-plus', component: UserPlus },
  { name: 'user-minus', component: UserMinus },
  { name: 'log-in', component: LogIn },
  { name: 'log-out', component: LogOut },
  { name: 'cog', component: Cog },
  { name: 'sliders', component: Sliders },
  { name: 'wrench', component: Wrench },
  { name: 'hammer', component: Hammer },
  { name: 'line-chart', component: LineChart },
  { name: 'history', component: History }
];

// 모든 아이콘 가져오기
const getAllLucideIcons = () => {
  console.log('Available icons count:', iconList.length);
  return iconList.sort((a, b) => a.name.localeCompare(b.name));
};

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
  currentIcon = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const allIcons = useMemo(() => getAllLucideIcons(), []);

  // 검색 필터링
  const filteredIcons = useMemo(() => {
    if (!searchTerm.trim()) return allIcons;
    
    const search = searchTerm.toLowerCase();
    return allIcons.filter(icon => 
      icon.name.toLowerCase().includes(search)
    );
  }, [allIcons, searchTerm]);

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
        </div>

        {/* 아이콘 그리드 */}
        <div className="icon-selector-content">
          <div className="icon-selector-grid">
            {filteredIcons.map(({ name, component: IconComponent }) => (
              <button
                key={name}
                className={`icon-selector-item ${currentIcon === name ? 'selected' : ''}`}
                onClick={() => handleIconSelect(name)}
                title={name}
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
          </p>
        </div>
      </div>
    </div>
  );
};

export default IconSelectorModal;
