import type { PlatformId, PostStatus } from '../types/postease';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileEdit,
  ShieldAlert,
} from 'lucide-react';

export function PlatformIcon({
  platform,
  size = 18,
  className = '',
}: {
  platform: PlatformId;
  size?: number;
  className?: string;
}) {
  if (platform === 'instagram') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-label="Instagram"
      >
        <rect
          x="2.5"
          y="2.5"
          width="19"
          height="19"
          rx="5.5"
          stroke="#E1306C"
          strokeWidth="2"
        />
        <circle cx="12" cy="12" r="4.2" stroke="#E1306C" strokeWidth="2" />
        <circle cx="17.3" cy="6.7" r="1.2" fill="#E1306C" />
      </svg>
    );
  }

  if (platform === 'facebook') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-label="Facebook"
      >
        <circle cx="12" cy="12" r="10" fill="#1877F2" />
        <path
          d="M13.4 19V12.6H15.5L15.8 10.1H13.4V8.6C13.4 7.9 13.6 7.4 14.6 7.4H15.9V5.2C15.6 5.1 14.8 5 13.9 5C12 5 10.7 6.1 10.7 8.3V10.1H8.6V12.6H10.7V19H13.4Z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  if (platform === 'youtube') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
        aria-label="YouTube"
      >
        <rect x="2" y="5" width="20" height="14" rx="4.5" fill="#FF0000" />
        <path d="M10 9L15.5 12L10 15V9Z" fill="#FFFFFF" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label="WhatsApp Business"
    >
      <path
        d="M12 2.5C6.8 2.5 2.5 6.7 2.5 11.9C2.5 13.7 3 15.4 3.9 16.9L2.8 21.2L7.2 20.1C8.6 20.9 10.3 21.3 12 21.3C17.2 21.3 21.5 17.1 21.5 11.9C21.5 6.7 17.2 2.5 12 2.5Z"
        fill="#10B981"
      />
      <path
        d="M9.3 8.2C9.1 7.8 8.9 7.8 8.6 7.8H8C7.8 7.8 7.4 7.9 7.1 8.2C6.8 8.5 6 9.2 6 10.7C6 12.2 7.1 13.6 7.2 13.8C7.4 14 9.3 17.1 12.4 18.3C14.9 19.3 15.4 19.1 16 19C16.6 18.9 17.7 18.3 18 17.6C18.2 16.9 18.2 16.3 18.2 16.2C18.1 16.1 17.9 16 17.6 15.9C17.3 15.7 15.8 15 15.5 14.9C15.2 14.8 15 14.7 14.8 15C14.6 15.3 14 16 13.8 16.2C13.6 16.4 13.4 16.4 13.1 16.3C12.8 16.1 11.8 15.8 10.6 14.8C9.7 14 9.1 13 8.9 12.7C8.7 12.4 8.9 12.2 9.1 12C9.3 11.8 9.5 11.5 9.6 11.3C9.8 11.1 9.8 10.9 9.9 10.7C10 10.5 9.9 10.3 9.8 10.1C9.8 9.9 9.2 8.5 9.3 8.2Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function StatusLabel({ status }: { status: PostStatus }) {
  const map: Record<
    PostStatus,
    { label: string; colorClass: string; Icon: typeof Clock }
  > = {
    scheduled: {
      label: 'Scheduled',
      colorClass: 'text-[#4648d4] dark:text-[#d0bcff]',
      Icon: Clock,
    },
    published: {
      label: 'Published',
      colorClass: 'text-[#006c49] dark:text-[#4EDEA3]',
      Icon: CheckCircle2,
    },
    draft: {
      label: 'Draft',
      colorClass: 'text-[#825100] dark:text-[#ffb95f]',
      Icon: FileEdit,
    },
    failed: {
      label: 'Failed',
      colorClass: 'text-[#ba1a1a] dark:text-[#ffb4ab]',
      Icon: AlertCircle,
    },
    pending_approval: {
      label: 'Needs Approval',
      colorClass: 'text-[#825100] dark:text-[#4cd7f6]',
      Icon: ShieldAlert,
    },
  };

  const info = map[status] || map.draft;
  const Icon = info.Icon;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0 ${info.colorClass}`}>
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      <span>{info.label}</span>
    </span>
  );
}
