declare module 'lucide-react' {
  import * as React from 'react';
  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
    className?: string;
  }
  export type LucideIcon = React.FC<LucideProps>;

  export const Split: LucideIcon;
  export const Layers: LucideIcon;
  export const CreditCard: LucideIcon;
  export const WalletCards: LucideIcon;
  export const Settings: LucideIcon;
  export const Wallet: LucideIcon;
  export const LogOut: LucideIcon;
  export const Copy: LucideIcon;
  export const Check: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const Key: LucideIcon;
  export const Loader2: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const XCircle: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const Plus: LucideIcon;
  export const Trash2: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const Coins: LucideIcon;
  export const Clock: LucideIcon;
  export const Save: LucideIcon;
  export const ToggleLeft: LucideIcon;
  export const ToggleRight: LucideIcon;
  export const Users: LucideIcon;

  const icons: { [key: string]: LucideIcon };
  export default icons;
}
