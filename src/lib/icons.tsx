import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function icon(children: ReactNode) {
  return function InlineIcon(props: IconProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        {children}
      </svg>
    );
  };
}

export const ArrowDown = icon(<path d="M12 5v14m-7-7 7 7 7-7" />);
export const ArrowLeft = icon(<path d="M19 12H5m7 7-7-7 7-7" />);
export const ArrowRight = icon(<path d="M5 12h14m-7-7 7 7-7 7" />);
export const Archive = icon(<><path d="M3 4h18v4H3zM5 8v12h14V8m-9 4h4" /></>);
export const Ban = icon(<><circle cx="12" cy="12" r="9" /><path d="m5.6 5.6 12.8 12.8" /></>);
export const BookOpen = icon(<><path d="M12 7v14m0-14C9 4 5 4 3 5v14c2-1 6-1 9 2m0-14c3-3 7-3 9-2v14c-2-1-6-1-9 2" /></>);
export const Camera = icon(<><path d="M4 7h3l2-3h6l2 3h3v13H4z" /><circle cx="12" cy="13" r="3" /></>);
export const Check = icon(<path d="m5 12 4 4L19 6" />);
export const CheckCircle = icon(<><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>);
export const CheckCircle2 = CheckCircle;
export const ChevronDown = icon(<path d="m6 9 6 6 6-6" />);
export const ChevronLeft = icon(<path d="m15 18-6-6 6-6" />);
export const ChevronRight = icon(<path d="m9 18 6-6-6-6" />);
export const CircleDashed = icon(<><circle cx="12" cy="12" r="9" strokeDasharray="4 3" /><circle cx="12" cy="12" r="2" /></>);
export const CircleUserRound = icon(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="9" r="3" /><path d="M6.5 19c1-3 3-4 5.5-4s4.5 1 5.5 4" /></>);
export const ClipboardList = icon(<><path d="M9 4h6v3H9zM6 6H4v15h16V6h-2M8 12h8m-8 4h8" /></>);
export const Compass = icon(<><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></>);
export const Copy = icon(<><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></>);
export const Cpu = icon(<><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M9 9h6v6H9zM9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4" /></>);
export const Crosshair = icon(<><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /></>);
export const Ellipsis = icon(<><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>);
export const Eye = icon(<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7" /><circle cx="12" cy="12" r="3" /></>);
export const EyeOff = icon(<><path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10 10 0 0 1 12 5c6.5 0 10 7 10 7a14 14 0 0 1-3 3.8M6.2 6.2C3.5 8 2 12 2 12s3.5 7 10 7c1 0 2-.2 2.8-.5" /></>);
export const ExternalLink = icon(<><path d="M14 4h6v6m0-6-9 9" /><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" /></>);
export const FileCode = icon(<><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M13 2v7h7M10 13l-2 2 2 2m4-4 2 2-2 2" /></>);
export const FileText = icon(<><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M13 2v7h7M8 13h8m-8 4h8" /></>);
export const Flame = icon(<path d="M12 22c4 0 7-3 7-7 0-3-2-5-4-7 0 3-2 4-2 4 0-5-3-8-5-10 1 5-4 8-4 13 0 4 3 7 8 7z" />);
export const FlaskConical = icon(<><path d="M9 3h6m-5 0v7l-6 10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1l-6-10V3m-7 12h12" /></>);
export const FlaskConicalOff = icon(<><path d="m3 3 18 18M9 3h6m-5 0v7l-6 10h10m-1-10V7" /><path d="M14 13h4" /></>);
export const Folder = icon(<path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v11H3z" />);
export const GitBranch = icon(<><circle cx="6" cy="3" r="2" /><circle cx="6" cy="21" r="2" /><circle cx="18" cy="6" r="2" /><path d="M6 5v14m12-11a6 6 0 0 1-6 6H6" /></>);
export const Globe = icon(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></>);
export const Grid = icon(<><rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" /><rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" /></>);
export const HelpCircle = icon(<><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4.3 1.8c-1.2 1.1-1.8 1.3-1.8 3.2m0 3h.01" /></>);
export const History = icon(<><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" /><path d="M3 3v5h5m4-1v5l3 2" /></>);
export const Home = icon(<><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1z" /></>);
export const Info = icon(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>);
export const KeyRound = icon(<><circle cx="8" cy="15" r="5" /><path d="m11.5 11.5 8-8 2 2-2 2 2 2-3 3-2-2-3.5 3.5" /></>);
export const Layers = icon(<><path d="m12 3 9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5" /></>);
export const LifeBuoy = icon(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /><path d="m5.6 5.6 4.3 4.3m4.2 4.2 4.3 4.3m0-12.8-4.3 4.3m-4.2 4.2-4.3 4.3" /></>);
export const Link2 = icon(<><path d="M10 13a5 5 0 0 0 7.1 0l2-2A5 5 0 0 0 12 3.9l-1.2 1.2m3.2 5a5 5 0 0 0-7.1 0l-2 2a5 5 0 0 0 7.1 7.1l1.2-1.2" /></>);
export const LinkIcon = Link2;
export const Loader2 = icon(<><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1" /><path d="M12 3a9 9 0 0 1 9 9" /></>);
export const Lock = icon(<><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3m-4 5v2" /></>);
export const LogIn = icon(<><path d="M10 17l5-5-5-5m5 5H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>);
export const LogOut = icon(<><path d="M14 17l5-5-5-5m5 5H8" /><path d="M12 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" /></>);
export const Mail = icon(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>);
export const Menu = icon(<><path d="M4 6h16M4 12h16M4 18h16" /></>);
export const MessageSquarePlus = icon(<><path d="M21 11.5a8.5 8.5 0 0 1-9 8.5 9 9 0 0 1-4-.9L3 21l1.9-4.7A8.5 8.5 0 1 1 21 11.5Z" /><path d="M12 8v7m-3.5-3.5h7" /></>);
export const Minus = icon(<path d="M5 12h14" />);
export const Monitor = icon(<><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8m-4-4v4" /></>);
export const Network = icon(<><circle cx="12" cy="5" r="2" /><circle cx="5" cy="18" r="2" /><circle cx="19" cy="18" r="2" /><path d="m11 7-5 9m7-9 5 9M7 18h10" /></>);
export const OctagonAlert = icon(<><path d="M8 3h8l5 5v8l-5 5H8l-5-5V8z" /><path d="M12 8v5m0 3h.01" /></>);
export const Pencil = icon(<><path d="m15 5 4 4M4 20l4-.8L19 8a2.8 2.8 0 0 0-4-4L4 15z" /></>);
export const Phone = icon(<><path d="M5 3h4l2 5-3 2a15 15 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z" /></>);
export const Pin = icon(<><path d="m16 3 5 5-4 1-4 5v4l-2 2-2-6-5-5 2-2h4l5-4z" /></>);
export const PinOff = icon(<><path d="m3 3 18 18M16 3l5 5-4 1-4 5v2m-3 1-2 2-2-6-3-3 2-2h4" /></>);
export const Play = icon(<path d="m8 5 12 7-12 7z" />);
export const Radar = icon(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><path d="M12 12 19 5M12 3v2m9 7h-2M5 12H3m9 9v-2" /></>);
export const RefreshCcw = icon(<><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3" /></>);
export const RotateCw = icon(<><path d="M20 7v5h-5M20 12a8 8 0 0 0-14-5L4 9m0 8v-5h5m-5 0a8 8 0 0 0 14 5l2-2" /></>);
export const Search = icon(<><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>);
export const Server = icon(<><rect x="3" y="4" width="18" height="7" rx="2" /><rect x="3" y="13" width="18" height="7" rx="2" /><path d="M7 7h.01M7 16h.01M11 7h6m-6 9h6" /></>);
export const Settings = icon(<><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2z" transform="translate(-1 -1)" /></>);
export const Share = icon(<><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.7 10.7 6.6-4.4m-6.6 7 6.6 4.4" /></>);
export const Shield = icon(<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" />);
export const ShieldAlert = icon(<><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" /><path d="M12 8v5m0 3h.01" /></>);
export const ShieldCheck = icon(<><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" /><path d="m9 12 2 2 4-4" /></>);
export const ShieldQuestion = icon(<><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" /><path d="M9.5 9a2.5 2.5 0 1 1 4.3 1.8c-1.2 1.1-1.8 1.3-1.8 3.2m0 3h.01" /></>);
export const ShieldX = icon(<><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" /><path d="m9 9 6 6m0-6-6 6" /></>);
export const Smartphone = icon(<><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M11 18h2" /></>);
export const Sparkles = icon(<><path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5zM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z" /></>);
export const Square = icon(<rect x="4" y="4" width="16" height="16" rx="2" />);
export const Terminal = icon(<><path d="m4 17 6-6-6-6m8 14h8" /></>);
export const Trash2 = icon(<><path d="M3 6h18m-2 0-1 15H6L5 6m3 0V4h8v2m-7 4v7m4-7v7" /></>);
export const TriangleAlert = icon(<><path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 4h.01" /></>);
export const AlertTriangle = TriangleAlert;
export const UserCheck = icon(<><circle cx="9" cy="8" r="4" /><path d="M3 21a6 6 0 0 1 12 0m3-8 2 2 4-4" /></>);
export const UserPlus = icon(<><circle cx="9" cy="8" r="4" /><path d="M3 21a6 6 0 0 1 12 0m4-9v6m-3-3h6" /></>);
export const UserX = icon(<><circle cx="9" cy="8" r="4" /><path d="M3 21a6 6 0 0 1 12 0m3-8 5 5m0-5-5 5" /></>);
export const Users = icon(<><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0m-1-9a3 3 0 1 0 0-6m2 9a6 6 0 0 1 5 6" /></>);
export const Volume2 = icon(<><path d="M4 10v4h4l5 4V6l-5 4zm12-2a6 6 0 0 1 0 8m2-11a10 10 0 0 1 0 14" /></>);
export const Wifi = icon(<><path d="M5 9a11 11 0 0 1 14 0M8 12a6 6 0 0 1 8 0m-5 3a2 2 0 0 1 2 0m-1 4h.01" /></>);
export const Workflow = icon(<><rect x="3" y="4" width="7" height="6" rx="1" /><rect x="14" y="14" width="7" height="6" rx="1" /><path d="M10 7h3a2 2 0 0 1 2 2v5m-5-3H7v4" /></>);
export const X = icon(<path d="m18 6-12 12M6 6l12 12" />);