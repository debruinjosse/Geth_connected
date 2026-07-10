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
      <path d="M28 208C52 166 87 136 132 118C167 104 190 74 196 28" />
      <path d="M92 130C84 112 84 92 96 68C116 82 122 102 112 126" />
      <path d="M120 114C116 94 121 72 138 48C154 64 156 86 146 108" />
      <path d="M150 92C148 72 156 50 174 28C190 46 190 68 176 88" />
      <path d="M64 156C48 144 36 126 30 104C54 106 68 120 70 144" />
      <path d="M98 160C80 154 64 140 52 120C76 118 94 128 104 150" />
      <path d="M136 152C120 148 104 138 90 122C112 118 130 126 142 144" />
      <path d="M166 132C152 130 138 122 124 110C144 106 160 112 172 126" />
      <path d="M68 192C54 186 40 174 28 156C48 154 64 162 76 178" />
      <path d="M106 196C92 188 82 176 76 160C96 160 110 170 118 188" />
    </svg>
  );
}
