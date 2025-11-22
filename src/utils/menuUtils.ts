import { 
  // 기본 아이콘들
  Code, 
  ShoppingCart, 
  TrendingUp, 
  Package,
  History,
  LayoutDashboard,
  Box,
  Database,
  FileText,
  Eye,
  Plus,
  PlusSquare,
  Truck,
  Search,
  MapPin,
  Edit,
  DollarSign,
  Monitor,
  Activity,
  CreditCard,
  Calendar,
  Bell,
  Home,
  //Sitemap,
  
  // 추가 유용한 아이콘들
  User,
  Users,
  Settings,
  BarChart3,
  PieChart,
  LineChart,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  HelpCircle,
  Star,
  Heart,
  Bookmark,
  Download,
  Upload,
  Share,
  Copy,
  Trash2,
  Save,
  RefreshCw,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Menu,
  MoreHorizontal,
  MoreVertical,
  Lock,
  Unlock,
  Shield,
  ShieldCheck,
  Key,
  LogIn,
  LogOut,
  UserPlus,
  UserMinus,
  Mail,
  Phone,
  MessageSquare,
  Send,
  Paperclip,
  Image,
  File,
  Folder,
  FolderOpen,
  Archive,
  Tag,
  Tags,
  Flag,
  Book,
  BookOpen,
  Globe,
  Link,
  ExternalLink,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Volume2,
  VolumeX,
  Play,
  Pause,
  // Stop,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Mic,
  MicOff,
  Camera,
  Video,
  VideoOff,
  Headphones,
  Speaker,
  Printer,
  Scan,
  QrCode,
  //Barcode,
  Smartphone,
  Tablet,
  Laptop,
 // Desktop,
  Server,
  HardDrive,
  Cpu,
  MemoryStick,
  Wrench,
  Hammer,
  //Screwdriver,
  Cog,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Power,
  PowerOff,
  Zap,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  Wind,
  Thermometer,
  Droplets,
  Flame,
  Snowflake,
  Umbrella,
  TreePine,
  Leaf,
  Flower,
  Bug,
  Fish,
  Bird,
  Cat,
  Dog,
  HeartHandshake,
  Hand,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Frown,
  Meh,
  Laugh,
  Angry,
  LucideIcon
} from 'lucide-react';

// 메뉴 아이콘 매핑 (Lucide React 사용 가능한 모든 아이콘들)
const iconMap: { [key: string]: LucideIcon } = {
  // 기본 메뉴 아이콘들
  'dashboard': LayoutDashboard,
  'home': Home,
  'box': Box,
  'shopping-cart': ShoppingCart,
  'database': Database,
  'file-text': FileText,
  'eye': Eye,
  'plus': Plus,
  'plus-square': PlusSquare,
  'truck': Truck,
  'search': Search,
  'map-pin': MapPin,
  'edit': Edit,
  'dollar-sign': DollarSign,
  'monitor': Monitor,
  'activity': Activity,
  'credit-card': CreditCard,
  'calendar': Calendar,
  'bell': Bell,
  'code': Code,
  'trending-up': TrendingUp,
  'package': Package,
  'history': History,
  // 'sitemap': Sitemap,
  
  // 사용자 관련
  'user': User,
  'users': Users,
  'user-plus': UserPlus,
  'user-minus': UserMinus,
  'log-in': LogIn,
  'log-out': LogOut,
  
  // 설정 및 관리
  'settings': Settings,
  'cog': Cog,
  'sliders': Sliders,
  'wrench': Wrench,
  'hammer': Hammer,
  // 'screwdriver': Screwdriver,
  
  // 차트 및 분석
  'bar-chart': BarChart3,
  'bar-chart-3': BarChart3,
  'pie-chart': PieChart,
  'line-chart': LineChart,
  'trending-down': TrendingDown,
  
  // 상태 및 알림
  'alert-circle': AlertCircle,
  'check-circle': CheckCircle,
  'x-circle': XCircle,
  'info': Info,
  'help-circle': HelpCircle,
  'star': Star,
  'heart': Heart,
  'bookmark': Bookmark,
  
  // 파일 및 문서
  'file': File,
  'folder': Folder,
  'folder-open': FolderOpen,
  'archive': Archive,
  'download': Download,
  'upload': Upload,
  'save': Save,
  'copy': Copy,
  'trash': Trash2,
  'trash-2': Trash2,
  
  // 네비게이션 및 UI
  'menu': Menu,
  'grid': Grid,
  'list': List,
  'filter': Filter,
  'sort-asc': SortAsc,
  'sort-desc': SortDesc,
  'more-horizontal': MoreHorizontal,
  'more-vertical': MoreVertical,
  
  // 방향 및 화살표
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  
  // 보안 및 권한
  'lock': Lock,
  'unlock': Unlock,
  'shield': Shield,
  'shield-check': ShieldCheck,
  'key': Key,
  
  // 통신 및 메시지
  'mail': Mail,
  'phone': Phone,
  'message-square': MessageSquare,
  'send': Send,
  'paperclip': Paperclip,
  
  // 미디어
  'image': Image,
  'camera': Camera,
  'video': Video,
  'video-off': VideoOff,
  'mic': Mic,
  'mic-off': MicOff,
  'volume-2': Volume2,
  'volume-x': VolumeX,
  'headphones': Headphones,
  'speaker': Speaker,
  
  // 재생 컨트롤
  'play': Play,
  'pause': Pause,
  // 'stop': Stop,
  'skip-back': SkipBack,
  'skip-forward': SkipForward,
  'repeat': Repeat,
  'shuffle': Shuffle,
  
  // 하드웨어 및 기술
  'printer': Printer,
  'scan': Scan,
  'qr-code': QrCode,
  // 'barcode': Barcode,
  'smartphone': Smartphone,
  'tablet': Tablet,
  'laptop': Laptop,
  // 'desktop': Desktop,
  'server': Server,
  'hard-drive': HardDrive,
  'cpu': Cpu,
  'memory-stick': MemoryStick,
  
  // 네트워크 및 연결
  'wifi': Wifi,
  'wifi-off': WifiOff,
  'globe': Globe,
  'link': Link,
  'external-link': ExternalLink,
  
  // 전원 및 제어
  'power': Power,
  'power-off': PowerOff,
  'zap': Zap,
  'toggle-left': ToggleLeft,
  'toggle-right': ToggleRight,
  
  // 날씨 및 자연
  'sun': Sun,
  'moon': Moon,
  'cloud': Cloud,
  'cloud-rain': CloudRain,
  'cloud-snow': CloudSnow,
  'wind': Wind,
  'thermometer': Thermometer,
  'droplets': Droplets,
  'flame': Flame,
  'snowflake': Snowflake,
  'umbrella': Umbrella,
  'tree-pine': TreePine,
  'leaf': Leaf,
  'flower': Flower,
  
  // 동물
  'bug': Bug,
  'fish': Fish,
  'bird': Bird,
  'cat': Cat,
  'dog': Dog,
  
  // 감정 및 반응
  'heart-handshake': HeartHandshake,
  'hand': Hand,
  'thumbs-up': ThumbsUp,
  'thumbs-down': ThumbsDown,
  'smile': Smile,
  'frown': Frown,
  'meh': Meh,
  'laugh': Laugh,
  'angry': Angry,
  
  // 기타 유용한 아이콘들
  'tag': Tag,
  'tags': Tags,
  'flag': Flag,
  'book': Book,
  'book-open': BookOpen,
  'share': Share,
  'refresh': RefreshCw,
  'refresh-cw': RefreshCw,
  'rotate-ccw': RotateCcw,
  'rotate-cw': RotateCw,
  'zoom-in': ZoomIn,
  'zoom-out': ZoomOut,
  'maximize': Maximize,
  'minimize': Minimize,
  'x': X,
  'check': Check,
  'battery': Battery,
  'battery-low': BatteryLow,
};

// 기본 아이콘 (매핑되지 않은 경우)
const defaultIcon = Code;

// 아이콘 가져오기 함수
export const getMenuIcon = (iconName: string): LucideIcon => {
  // Debug 로그 제거 (요청: 반환할 아이콘 관련 콘솔 미출력)
  // 필요 시 아래 주석 해제하여 문제 분석 가능
  // if (process.env.NODE_ENV === 'development') {
  //   console.debug('[menuUtils] getMenuIcon:', { iconName, found: !!iconMap[iconName] });
  // }
  return iconMap[iconName] || defaultIcon;
};

// 메뉴 데이터를 계층 구조로 변환하는 함수
export const buildMenuHierarchy = (menus: any[]): any[] => {
  //console.log('메뉴 계층 구조 변환 시작:', menus);
  
  const menuMap = new Map();
  const rootMenus: any[] = [];

  // 모든 메뉴를 Map에 저장 (menu_id를 숫자로 통일)
  menus.forEach(menu => {
    const menuId = typeof menu.menu_id === 'string' ? parseInt(menu.menu_id) : menu.menu_id;
    const parentId = menu.menu_parent_id ? (typeof menu.menu_parent_id === 'string' ? parseInt(menu.menu_parent_id) : menu.menu_parent_id) : null;
    
    menuMap.set(menuId, {
      ...menu,
      menu_id: menuId,
      menu_parent_id: parentId,
      children: []
    });
  });

  // 계층 구조 구성
  menus.forEach(menu => {
    const menuId = typeof menu.menu_id === 'string' ? parseInt(menu.menu_id) : menu.menu_id;
    const parentId = menu.menu_parent_id ? (typeof menu.menu_parent_id === 'string' ? parseInt(menu.menu_parent_id) : menu.menu_parent_id) : null;
    
    const menuItem = menuMap.get(menuId);
    
    if (parentId === null || parentId === 0) {
      // 최상위 메뉴
      rootMenus.push(menuItem);
      //console.log('최상위 메뉴 추가:', menu.menu_name, 'ID:', menuId);
    } else {
      // 하위 메뉴
      const parentMenu = menuMap.get(parentId);
      if (parentMenu) {
        parentMenu.children.push(menuItem);
        //console.log('하위 메뉴 추가:', menu.menu_name, '부모:', parentMenu.menu_name, 'ID:', menuId, '부모 ID:', parentId);
      } else {
        //console.log('부모 메뉴를 찾을 수 없음:', menu.menu_name, '부모 ID:', parentId, '사용 가능한 메뉴 ID들:', Array.from(menuMap.keys()));
      }
    }
  });

  // 각 레벨별로 정렬
  const sortMenus = (menuList: any[]) => {
    menuList.sort((a, b) => a.menu_order - b.menu_order);
    menuList.forEach(menu => {
      if (menu.children && menu.children.length > 0) {
        sortMenus(menu.children);
      }
    });
  };

  sortMenus(rootMenus);
  //console.log('최종 계층 구조:', rootMenus);
  return rootMenus;
};

// 시스템 관리자 권한 확인 함수
export const isSystemAdmin = (roleLevel: number): boolean => {
  return roleLevel === 1; // 시스템 관리자는 role_level이 1
};

// 메뉴 접근 권한 확인 함수
export const hasMenuAccess = (menu: any, userRoleLevel: number): boolean => {
  // 시스템 관리자는 모든 메뉴에 접근 가능
  if (isSystemAdmin(userRoleLevel)) {
    return true;
  }
  
  // 활성 상태인 메뉴만 접근 가능
  return menu.menu_status === 'A';
};

/*
=== Lucide React 사용 가능한 아이콘 목록 ===

기본 메뉴 아이콘들:
- dashboard, home, box, shopping-cart, database, file-text, eye, plus, plus-square
- truck, search, map-pin, edit, dollar-sign, monitor, activity, credit-card
- calendar, bell, code, trending-up, package, history, sitemap

사용자 관련:
- user, users, user-plus, user-minus, log-in, log-out

설정 및 관리:
- settings, cog, sliders, wrench, hammer, screwdriver

차트 및 분석:
- bar-chart, bar-chart-3, pie-chart, line-chart, trending-down

상태 및 알림:
- alert-circle, check-circle, x-circle, info, help-circle, star, heart, bookmark

파일 및 문서:
- file, folder, folder-open, archive, download, upload, save, copy, trash, trash-2

네비게이션 및 UI:
- menu, grid, list, filter, sort-asc, sort-desc, more-horizontal, more-vertical

방향 및 화살표:
- chevron-down, chevron-up, chevron-left, chevron-right
- arrow-up, arrow-down, arrow-left, arrow-right

보안 및 권한:
- lock, unlock, shield, shield-check, key

통신 및 메시지:
- mail, phone, message-square, send, paperclip

미디어:
- image, camera, video, video-off, mic, mic-off, volume-2, volume-x
- headphones, speaker

재생 컨트롤:
- play, pause, stop, skip-back, skip-forward, repeat, shuffle

하드웨어 및 기술:
- printer, scan, qr-code, barcode, smartphone, tablet, laptop, desktop
- server, hard-drive, cpu, memory-stick

네트워크 및 연결:
- wifi, wifi-off, globe, link, external-link

전원 및 제어:
- power, power-off, zap, toggle-left, toggle-right

날씨 및 자연:
- sun, moon, cloud, cloud-rain, cloud-snow, wind, thermometer, droplets
- flame, snowflake, umbrella, tree-pine, leaf, flower

동물:
- bug, fish, bird, cat, dog

감정 및 반응:
- heart-handshake, hand, thumbs-up, thumbs-down, smile, frown, meh, laugh, angry

기타 유용한 아이콘들:
- tag, tags, flag, book, book-open, share, refresh, refresh-cw
- rotate-ccw, rotate-cw, zoom-in, zoom-out, maximize, minimize, x, check
- battery, battery-low

사용법:
DB의 menu_icon 필드에 위의 아이콘 이름을 저장하면 자동으로 해당 아이콘이 표시됩니다.
예: 'user', 'settings', 'bar-chart', 'lock' 등
*/
