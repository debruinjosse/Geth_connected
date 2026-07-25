import type { CSSProperties } from "react";

type GoldenLeavesProps = {
  className?: string;
  mirrored?: boolean;
  style?: CSSProperties;
};

export function GoldenLeaves({ className = "", mirrored = false, style }: GoldenLeavesProps) {
  return (
    <svg
      aria-hidden="true"
      className={`golden-leaves ${mirrored ? "mirrored" : ""} ${className}`.trim()}
      style={style}
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path className="golden-leaf-stem" d="M42 184C74 151 103 112 126 58" />
      <path className="golden-leaf" d="M74 144C47 137 31 116 28 88C58 90 78 112 82 139C80 142 77 144 74 144Z" />
      <path className="golden-leaf" d="M105 103C83 87 75 60 84 34C111 47 123 73 113 100C111 102 108 103 105 103Z" />
      <path className="golden-leaf" d="M128 60C138 34 160 18 188 17C181 47 160 67 132 68C130 66 129 63 128 60Z" />
      <path className="golden-leaf" d="M64 174C42 175 22 163 10 142C35 136 58 146 70 166C69 170 67 172 64 174Z" />
    </svg>
  );
}
