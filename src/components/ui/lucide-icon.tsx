// This file acts as a drop-in replacement for lucide-react-native
import { Feather, MaterialIcons } from '@expo/vector-icons';

// Map lucide names to vector icon names
const iconMap: Record<string, any> = {
  // Basic icons
  Mail: (props: any) => <Feather name="mail" {...props} />,
  Lock: (props: any) => <Feather name="lock" {...props} />,
  ArrowLeft: (props: any) => <Feather name="arrow-left" {...props} />,
  Eye: (props: any) => <Feather name="eye" {...props} />,
  EyeOff: (props: any) => <Feather name="eye-off" {...props} />,
  AlertCircle: (props: any) => <Feather name="alert-circle" {...props} />,
  
  // Navigation
  Menu: (props: any) => <Feather name="menu" {...props} />,
  Bell: (props: any) => <Feather name="bell" {...props} />,
  Search: (props: any) => <Feather name="search" {...props} />,
  Home: (props: any) => <Feather name="home" {...props} />,
  Settings: (props: any) => <Feather name="settings" {...props} />,
  LogOut: (props: any) => <Feather name="log-out" {...props} />,
  X: (props: any) => <Feather name="x" {...props} />,
  Plus: (props: any) => <Feather name="plus" {...props} />,
  Save: (props: any) => <Feather name="save" {...props} />,
  RefreshCw: (props: any) => <Feather name="refresh-cw" {...props} />,
  ChevronRight: (props: any) => <Feather name="chevron-right" {...props} />,
  ChevronLeft: (props: any) => <Feather name="chevron-left" {...props} />,
  ChevronDown: (props: any) => <Feather name="chevron-down" {...props} />,
  ChevronUp: (props: any) => <Feather name="chevron-up" {...props} />,
  
  // User/Profile
  User: (props: any) => <Feather name="user" {...props} />,
  Users: (props: any) => <Feather name="users" {...props} />,
  Award: (props: any) => <Feather name="award" {...props} />,
  Shield: (props: any) => <Feather name="shield" {...props} />,
  BookOpen: (props: any) => <Feather name="book-open" {...props} />,
  Edit3: (props: any) => <Feather name="edit-2" {...props} />,
  Trash2: (props: any) => <Feather name="trash-2" {...props} />,
  Camera: (props: any) => <Feather name="camera" {...props} />,
  
  // Ratings & Social
  Star: (props: any) => <MaterialIcons name="star" {...props} />,
  Heart: (props: any) => <Feather name="heart" {...props} />,
  ThumbsUp: (props: any) => <Feather name="thumbs-up" {...props} />,
  MessageCircle: (props: any) => <Feather name="message-circle" {...props} />,
  HelpCircle: (props: any) => <Feather name="help-circle" {...props} />,
  Phone: (props: any) => <Feather name="phone" {...props} />,
  
  // Business/Location
  Briefcase: (props: any) => <Feather name="briefcase" {...props} />,
  Building2: (props: any) => <Feather name="building" {...props} />,
  MapPin: (props: any) => <Feather name="map-pin" {...props} />,
  LocateFixed: (props: any) => <Feather name="crosshair" {...props} />,
  Navigation: (props: any) => <Feather name="navigation" {...props} />,
  Compass: (props: any) => <Feather name="compass" {...props} />,
  
  // Tags
  Tag: (props: any) => <Feather name="tag" {...props} />,
  
  // Media/Controls
  Play: (props: any) => <Feather name="play" {...props} />,
  Pause: (props: any) => <Feather name="pause" {...props} />,
  
  // Flags
  Flag: (props: any) => <Feather name="flag" {...props} />,
  
  // Time/Date
  Calendar: (props: any) => <Feather name="calendar" {...props} />,
  Clock: (props: any) => <Feather name="clock" {...props} />,
  
  // Money
  DollarSign: (props: any) => <Feather name="dollar-sign" {...props} />,
  Wallet: (props: any) => <Feather name="dollar-sign" {...props} />,
  Gift: (props: any) => <Feather name="gift" {...props} />,
  
  // Status
  CheckCircle: (props: any) => <Feather name="check-circle" {...props} />,
  XCircle: (props: any) => <Feather name="x-circle" {...props} />,
  Zap: (props: any) => <Feather name="zap" {...props} />,
  TrendingUp: (props: any) => <Feather name="trending-up" {...props} />,
  BarChart2: (props: any) => <Feather name="bar-chart-2" {...props} />,
  LayoutDashboard: (props: any) => <Feather name="layout-dashboard" {...props} />,
  
  // Info
  Info: (props: any) => <Feather name="info" {...props} />,
  
  // Provider specific
  Wrench: (props: any) => <Feather name="wrench" {...props} />,
  Tool: (props: any) => <Feather name="tool" {...props} />,
  Clipboard: (props: any) => <Feather name="clipboard" {...props} />,
  ClipboardList: (props: any) => <Feather name="clipboard" {...props} />,
  
  // Additional icons
  CreditCard: (props: any) => <Feather name="credit-card" {...props} />,
  Download: (props: any) => <Feather name="download" {...props} />,
  Upload: (props: any) => <Feather name="upload" {...props} />,
  Share2: (props: any) => <Feather name="share-2" {...props} />,
  Copy: (props: any) => <Feather name="copy" {...props} />,
  ExternalLink: (props: any) => <Feather name="external-link" {...props} />,
  MoreHorizontal: (props: any) => <Feather name="more-horizontal" {...props} />,
  MoreVertical: (props: any) => <Feather name="more-vertical" {...props} />,
  Filter: (props: any) => <Feather name="filter" {...props} />,
  Sliders: (props: any) => <Feather name="sliders" {...props} />,
  
  // Media
  Image: (props: any) => <Feather name="image" {...props} />,
  Video: (props: any) => <Feather name="video" {...props} />,
  Music: (props: any) => <Feather name="music" {...props} />,
  
  // Files
  File: (props: any) => <Feather name="file" {...props} />,
  FileText: (props: any) => <Feather name="file-text" {...props} />,
  Folder: (props: any) => <Feather name="folder" {...props} />,
  
  // Arrows
  ArrowRight: (props: any) => <Feather name="arrow-right" {...props} />,
  ArrowUp: (props: any) => <Feather name="arrow-up" {...props} />,
  ArrowDown: (props: any) => <Feather name="arrow-down" {...props} />,
  
  // Devices
  Smartphone: (props: any) => <Feather name="smartphone" {...props} />,
  Tablet: (props: any) => <Feather name="tablet" {...props} />,
  Monitor: (props: any) => <Feather name="monitor" {...props} />,
  
  // Weather
  Sun: (props: any) => <Feather name="sun" {...props} />,
  Moon: (props: any) => <Feather name="moon" {...props} />,
  Cloud: (props: any) => <Feather name="cloud" {...props} />,
  
  // Shopping
  ShoppingCart: (props: any) => <Feather name="shopping-cart" {...props} />,
  ShoppingBag: (props: any) => <Feather name="shopping-bag" {...props} />,
  
  // Alerts
  BellOff: (props: any) => <Feather name="bell-off" {...props} />,
  Volume2: (props: any) => <Feather name="volume-2" {...props} />,
  VolumeX: (props: any) => <Feather name="volume-x" {...props} />,

  // Add this with the other location/business icons
  Crosshair: (props: any) => <Feather name="crosshair" {...props} />,
  // Add this with other status/activity icons
Activity: (props: any) => <Feather name="activity" {...props} />,

// Add to iconMap
Office: (props: any) => <MaterialIcons name="business" {...props} />,
Map: (props: any) => <MaterialIcons name="map" {...props} />,
Check: (props: any) => <Feather name="check" {...props} />,
Brain: (props: any) => <Feather name="brain" {...props} />
};

// Export all icons
export const Mail = (props: any) => iconMap.Mail(props);
export const Lock = (props: any) => iconMap.Lock(props);
export const ArrowLeft = (props: any) => iconMap.ArrowLeft(props);
export const Eye = (props: any) => iconMap.Eye(props);
export const EyeOff = (props: any) => iconMap.EyeOff(props);
export const AlertCircle = (props: any) => iconMap.AlertCircle(props);
export const Menu = (props: any) => iconMap.Menu(props);
export const Bell = (props: any) => iconMap.Bell(props);
export const Search = (props: any) => iconMap.Search(props);
export const User = (props: any) => iconMap.User(props);
export const Users = (props: any) => iconMap.Users(props);
export const Home = (props: any) => iconMap.Home(props);
export const Settings = (props: any) => iconMap.Settings(props);
export const LogOut = (props: any) => iconMap.LogOut(props);
export const X = (props: any) => iconMap.X(props);
export const Plus = (props: any) => iconMap.Plus(props);
export const Save = (props: any) => iconMap.Save(props);
export const RefreshCw = (props: any) => iconMap.RefreshCw(props);
export const Star = (props: any) => iconMap.Star(props);
export const Heart = (props: any) => iconMap.Heart(props);
export const MapPin = (props: any) => iconMap.MapPin(props);
export const LocateFixed = (props: any) => iconMap.LocateFixed(props);
export const Calendar = (props: any) => iconMap.Calendar(props);
export const Clock = (props: any) => iconMap.Clock(props);
export const CheckCircle = (props: any) => iconMap.CheckCircle(props);
export const XCircle = (props: any) => iconMap.XCircle(props);
export const ChevronRight = (props: any) => iconMap.ChevronRight(props);
export const ChevronLeft = (props: any) => iconMap.ChevronLeft(props);
export const ChevronDown = (props: any) => iconMap.ChevronDown(props);
export const ChevronUp = (props: any) => iconMap.ChevronUp(props);
export const Briefcase = (props: any) => iconMap.Briefcase(props);
export const Building2 = (props: any) => iconMap.Building2(props);
export const DollarSign = (props: any) => iconMap.DollarSign(props);
export const Wallet = (props: any) => iconMap.Wallet(props);
export const Gift = (props: any) => iconMap.Gift(props);
export const MessageCircle = (props: any) => iconMap.MessageCircle(props);
export const HelpCircle = (props: any) => iconMap.HelpCircle(props);
export const Phone = (props: any) => iconMap.Phone(props);
export const Shield = (props: any) => iconMap.Shield(props);
export const BookOpen = (props: any) => iconMap.BookOpen(props);
export const TrendingUp = (props: any) => iconMap.TrendingUp(props);
export const Navigation = (props: any) => iconMap.Navigation(props);
export const BarChart2 = (props: any) => iconMap.BarChart2(props);
export const Edit3 = (props: any) => iconMap.Edit3(props);
export const Trash2 = (props: any) => iconMap.Trash2(props);
export const Camera = (props: any) => iconMap.Camera(props);
export const ThumbsUp = (props: any) => iconMap.ThumbsUp(props);
export const Zap = (props: any) => iconMap.Zap(props);
export const Award = (props: any) => iconMap.Award(props);
export const Info = (props: any) => iconMap.Info(props);
export const LayoutDashboard = (props: any) => iconMap.LayoutDashboard(props);
export const Wrench = (props: any) => iconMap.Wrench(props);
export const Tool = (props: any) => iconMap.Tool(props);
export const Clipboard = (props: any) => iconMap.Clipboard(props);
export const ClipboardList = (props: any) => iconMap.ClipboardList(props);
export const Tag = (props: any) => iconMap.Tag(props);
export const Play = (props: any) => iconMap.Play(props);
export const Flag = (props: any) => iconMap.Flag(props);
export const CreditCard = (props: any) => iconMap.CreditCard(props);
export const Download = (props: any) => iconMap.Download(props);
export const Upload = (props: any) => iconMap.Upload(props);
export const Share2 = (props: any) => iconMap.Share2(props);
export const Copy = (props: any) => iconMap.Copy(props);
export const ExternalLink = (props: any) => iconMap.ExternalLink(props);
export const MoreHorizontal = (props: any) => iconMap.MoreHorizontal(props);
export const MoreVertical = (props: any) => iconMap.MoreVertical(props);
export const Filter = (props: any) => iconMap.Filter(props);
export const Sliders = (props: any) => iconMap.Sliders(props);
export const Image = (props: any) => iconMap.Image(props);
export const Video = (props: any) => iconMap.Video(props);
export const Music = (props: any) => iconMap.Music(props);
export const File = (props: any) => iconMap.File(props);
export const FileText = (props: any) => iconMap.FileText(props);
export const Folder = (props: any) => iconMap.Folder(props);
export const ArrowRight = (props: any) => iconMap.ArrowRight(props);
export const ArrowUp = (props: any) => iconMap.ArrowUp(props);
export const ArrowDown = (props: any) => iconMap.ArrowDown(props);
export const Smartphone = (props: any) => iconMap.Smartphone(props);
export const Tablet = (props: any) => iconMap.Tablet(props);
export const Monitor = (props: any) => iconMap.Monitor(props);
export const Sun = (props: any) => iconMap.Sun(props);
export const Moon = (props: any) => iconMap.Moon(props);
export const Cloud = (props: any) => iconMap.Cloud(props);
export const ShoppingCart = (props: any) => iconMap.ShoppingCart(props);
export const ShoppingBag = (props: any) => iconMap.ShoppingBag(props);
export const BellOff = (props: any) => iconMap.BellOff(props);
export const Volume2 = (props: any) => iconMap.Volume2(props);
export const VolumeX = (props: any) => iconMap.VolumeX(props);
export const Pause = (props: any) => iconMap.Pause(props);
export const Crosshair = (props: any) => iconMap.Crosshair(props);
export const Activity = (props: any) => iconMap.Activity(props);
export const Office = (props: any) => iconMap.Office(props);
export const Map = (props: any) => iconMap.Maps(props);
export const Check = (props: any) => iconMap.Check(props);
export const Brain = (props: any) => iconMap.Brain(props);