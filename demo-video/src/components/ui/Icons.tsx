// Inline SVG paths extracted from Material Symbols Outlined
// No icon font dependency â€” renders cleanly in headless Chrome

interface IconProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

const Icon = ({ path, size = 24, color = "currentColor", style }: IconProps & { path: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: "block", flexShrink: 0, ...style }}>
    <path d={path} fill={color} />
  </svg>
);

export const RobotIcon = (p: IconProps) => <Icon {...p} path="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.58 19L6.15 20.45 7.56 21.86 9 20.42V19H7.58M16.42 19v1.42L17.86 21.86 19.27 20.45 17.85 19H16.42M9 14.5A1.5 1.5 0 0 0 7.5 16 1.5 1.5 0 0 0 9 17.5 1.5 1.5 0 0 0 10.5 16 1.5 1.5 0 0 0 9 14.5m6 0a1.5 1.5 0 0 0-1.5 1.5 1.5 1.5 0 0 0 1.5 1.5 1.5 1.5 0 0 0 1.5-1.5 1.5 1.5 0 0 0-1.5-1.5z" />;

export const AddCircleIcon = (p: IconProps) => <Icon {...p} path="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />;

export const RestaurantIcon = (p: IconProps) => <Icon {...p} path="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" />;

export const PaymentsIcon = (p: IconProps) => <Icon {...p} path="M19 14V6c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zm-9-1c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm13-6v11c0 1.1-.9 2-2 2H4v-2h17V7h2z" />;

export const PendingIcon = (p: IconProps) => <Icon {...p} path="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-4h2v2h-2zm0-10h2v8h-2z" />;

export const CheckCircleIcon = (p: IconProps) => <Icon {...p} path="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />;

export const QRCodeIcon = (p: IconProps) => <Icon {...p} path="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13 4h-2v2h2v-2zm0-4h-2v2h2v-2zm2 0h-2v2h2v-2zm-2 4h-2v2h2v-2zm-4-4h2v-2h-2v2zm2 4h-2v2h2v-2zm2 0h-2v2h2v-2z" />;

export const TableRestaurantIcon = (p: IconProps) => <Icon {...p} path="M18.56 10.45C18.84 9.98 19 9.46 19 9c0-1.85-1.85-3.6-4.67-4.67L13 7l-1-2.93C11.37 4.02 10.7 4 10 4 6.69 4 4 6.24 4 9c0 .46.16.98.44 1.45L3 21h18l-2.44-10.55zM13 7l1.3-3.81C15.78 3.85 17 4.86 17 6c0 .41-.14.84-.4 1.22L13 7zM10 6c.26 0 .5.02.75.05L12 10H8L9.25 6.05C9.5 6.02 9.74 6 10 6z" />;

export const ScheduleIcon = (p: IconProps) => <Icon {...p} path="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />;

export const StarIcon = (p: IconProps) => <Icon {...p} path="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />;

export const SkillIcon = (p: IconProps) => <Icon {...p} path="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />;

export const CancelIcon = (p: IconProps) => <Icon {...p} path="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />;

export const SendIcon = (p: IconProps) => <Icon {...p} path="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />;

export const NotificationsIcon = (p: IconProps) => <Icon {...p} path="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />;

