import type { ReactNode } from 'react';

type IconProps = {
  size?: number;
  className?: string;
};

const Svg = ({ size = 18, className, children }: IconProps & { children: ReactNode }) => (
  <svg
    aria-hidden='true'
    className={className}
    fill='none'
    height={size}
    viewBox='0 0 24 24'
    width={size}
    xmlns='http://www.w3.org/2000/svg'
  >
    <g stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.5'>
      {children}
    </g>
  </svg>
);

export const MenuIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d='M4 6h16M4 12h16M4 18h16' />
  </Svg>
);

export const TerminalPromptIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d='m5 7 4 5-4 5' />
    <path d='M12 17h7' />
  </Svg>
);

export const FolderIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d='M3.5 6.5h6l2 2h9v9a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 17.5z' />
  </Svg>
);

export const ChevronDownIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d='m8 10 4 4 4-4' />
  </Svg>
);

export const SlidersIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d='M4 7h8M16 7h4M4 17h4M12 17h8' />
    <circle cx='14' cy='7' r='2' />
    <circle cx='10' cy='17' r='2' />
  </Svg>
);

export const StopCircleIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx='12' cy='12' r='8.5' />
    <rect height='5' rx='0.75' width='5' x='9.5' y='9.5' />
  </Svg>
);

export const SendIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d='M12 19V5' />
    <path d='m6.5 11 5.5-6 5.5 6' />
  </Svg>
);

export const MicIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect height='10' rx='3' width='6' x='9' y='3.5' />
    <path d='M6.5 11a5.5 5.5 0 0 0 11 0M12 16.5V20M9 20h6' />
  </Svg>
);

export const AudioWaveIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d='M4 10v4M7 7v10M10 9v6M13 5v14M16 8v8M19 10v4' />
  </Svg>
);

export const BranchIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx='6' cy='5' r='2' />
    <circle cx='6' cy='19' r='2' />
    <circle cx='18' cy='7' r='2' />
    <path d='M6 7v10M8 7h3a5 5 0 0 1 5 5v0' />
    <path d='M16 10.5V9' />
  </Svg>
);

export const FileIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d='M6 3.5h7l5 5V20a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 20z' />
    <path d='M13 3.5V9h5' />
  </Svg>
);

export const SearchIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx='10.5' cy='10.5' r='5.5' />
    <path d='m15 15 4.5 4.5' />
  </Svg>
);

export const EditIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d='m4 20 4.2-1 9.4-9.4-3.2-3.2L5 15.8z' />
    <path d='m13.5 7.5 3 3' />
  </Svg>
);

export const GlobeIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx='12' cy='12' r='8.5' />
    <path d='M3.5 12h17M12 3.5c2.5 2.3 3.8 5.3 3.8 8.5S14.5 18.2 12 20.5c-2.5-2.3-3.8-5.3-3.8-8.5S9.5 5.8 12 3.5z' />
  </Svg>
);

export const ToolIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d='M14.5 6.5a4 4 0 0 0-5.6 4.8L4 16.2V20h3.8l4.9-4.9a4 4 0 0 0 4.8-5.6l-2.6 2.6-2.4-2.4z' />
  </Svg>
);
