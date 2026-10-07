"use client";

import dynamic from "next/dynamic";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";

const QrScanClient = dynamic(() => import("@/components/QrScanClient").then((mod) => mod.QrScanClient), {
  ssr: false,
  loading: () => <Card><Alert tone="info">Loading scanner…</Alert></Card>
});

export function QrScanClientLazy() {
  return <QrScanClient />;
}
