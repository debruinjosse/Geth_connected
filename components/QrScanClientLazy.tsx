"use client";

import dynamic from "next/dynamic";

const QrScanClient = dynamic(() => import("@/components/QrScanClient").then((mod) => mod.QrScanClient), {
  ssr: false,
  loading: () => <div className="panel dashboard-panel qr-scan-loading">Loading scanner…</div>
});

export function QrScanClientLazy() {
  return <QrScanClient />;
}
