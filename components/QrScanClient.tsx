"use client";

import jsQR from "jsqr";
import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Camera, ImageUp, Keyboard, QrCode, XCircle } from "lucide-react";

type BarcodeResult = {
  rawValue: string;
};

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => {
  detect(source: CanvasImageSource): Promise<BarcodeResult[]>;
};

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

const MAX_DECODE_SIZE = 960;
const VALID_LOCALES = new Set(["en", "nl", "fr", "da"]);
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,80}$/i;

function resolveClaimSlug(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const slugFromPath = (pathname: string) => {
    const parts = pathname.split("/").filter(Boolean);
    const claimIndex = parts.findIndex((part) => part === "claim-card");

    if (claimIndex < 0) return "";
    const maybeSlug = parts[claimIndex + 1] ?? "";
    return SLUG_PATTERN.test(maybeSlug) ? maybeSlug : "";
  };

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const slug = slugFromPath(url.pathname);
      return slug ? decodeURIComponent(slug) : "";
    } catch {
      return "";
    }
  }

  const withoutQuery = trimmed.replace(/[?#].*$/, "").replace(/^\/+/, "");
  const parts = withoutQuery.split("/").filter(Boolean);
  const [firstPart, secondPart, thirdPart] = parts;

  if (VALID_LOCALES.has(firstPart) && secondPart === "claim-card" && SLUG_PATTERN.test(thirdPart ?? "")) {
    return thirdPart;
  }

  if (firstPart === "claim-card" && SLUG_PATTERN.test(secondPart ?? "")) {
    return secondPart;
  }

  if (parts.length === 1 && SLUG_PATTERN.test(firstPart)) {
    return firstPart;
  }

  return "";
}

export function QrScanClient() {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectorRef = useRef<InstanceType<BarcodeDetectorConstructor> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scanSessionRef = useRef(0);
  const [manualValue, setManualValue] = useState("");
  const [status, setStatus] = useState("Camera scanner is ready.");
  const [scanning, setScanning] = useState(false);
  const [imageScanning, setImageScanning] = useState(false);

  const locale = typeof params.locale === "string" ? params.locale : "en";

  function getCanvas() {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }

    return canvasRef.current;
  }

  function drawSourceToCanvas(source: CanvasImageSource, sourceWidth: number, sourceHeight: number) {
    if (!sourceWidth || !sourceHeight) return null;

    const scale = Math.min(1, MAX_DECODE_SIZE / Math.max(sourceWidth, sourceHeight));
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = getCanvas();
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) return null;

    canvas.width = width;
    canvas.height = height;
    context.drawImage(source, 0, 0, width, height);

    return canvas;
  }

  async function detectWithNativeScanner(source: CanvasImageSource) {
    if (!window.BarcodeDetector) return "";

    try {
      detectorRef.current ??= new window.BarcodeDetector({ formats: ["qr_code"] });
      const codes = await detectorRef.current.detect(source);
      return codes[0]?.rawValue ?? "";
    } catch {
      return "";
    }
  }

  function detectWithJsQr(canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return "";

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const result = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth"
    });

    return result?.data ?? "";
  }

  async function detectQrFromCanvas(canvas: HTMLCanvasElement) {
    const nativeResult = await detectWithNativeScanner(canvas);
    if (nativeResult) return nativeResult;

    return detectWithJsQr(canvas);
  }

  async function detectQrFromVideo(video: HTMLVideoElement) {
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return "";

    const nativeResult = await detectWithNativeScanner(video);
    if (nativeResult) return nativeResult;

    const canvas = drawSourceToCanvas(video, video.videoWidth, video.videoHeight);
    return canvas ? detectWithJsQr(canvas) : "";
  }

  function stopScanLoop() {
    scanSessionRef.current += 1;

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }

  function goToClaim(rawValue: string) {
    const slug = resolveClaimSlug(rawValue);
    if (!slug) {
      setStatus("Invalid QR. This does not look like a GETH card link or card slug.");
      return;
    }

    setStatus("Valid card found. Redirecting to the claim form...");
    stopScanner();
    router.push(`/${locale}/claim-card/${encodeURIComponent(slug)}?source=qr_scan`);
  }

  function stopScanner() {
    stopScanLoop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }

  async function startScanner() {
    try {
      stopScanner();
      setStatus("Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          height: { ideal: 720 },
          width: { ideal: 1280 }
        },
        audio: false
      });
      streamRef.current = stream;
      setScanning(true);
      setStatus("Camera ready. Point your camera at the QR code.");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const session = scanSessionRef.current;
      let lastScanAt = 0;
      let decoding = false;

      const tick = async (timestamp: number) => {
        if (session !== scanSessionRef.current || !videoRef.current || !streamRef.current) return;

        if (!decoding && timestamp - lastScanAt > 220) {
          decoding = true;
          lastScanAt = timestamp;

          try {
            const code = await detectQrFromVideo(videoRef.current);
            if (code) {
              goToClaim(code);
              return;
            }
          } catch {
            setStatus("Scanning paused. Keep the QR code steady inside the frame.");
          } finally {
            decoding = false;
          }
        }

        animationFrameRef.current = window.requestAnimationFrame(tick);
      };

      animationFrameRef.current = window.requestAnimationFrame(tick);
    } catch {
      setStatus("Permission denied or camera unavailable. Paste the QR link or card slug below.");
      setScanning(false);
    }
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (!file) return;

    stopScanner();
    setImageScanning(true);
    setStatus("Reading QR code from selected image...");

    let objectUrl = "";

    try {
      objectUrl = URL.createObjectURL(file);
      const image = new Image();
      image.decoding = "async";
      image.src = objectUrl;

      await image.decode();

      const canvas = drawSourceToCanvas(image, image.naturalWidth, image.naturalHeight);
      const code = canvas ? await detectQrFromCanvas(canvas) : "";

      if (code) {
        goToClaim(code);
        return;
      }

      setStatus("No QR code was found in that image. Try a clearer screenshot or use the camera scanner.");
    } catch {
      setStatus("Could not read that image. Try a screenshot/photo with the QR code fully visible.");
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setImageScanning(false);
    }
  }

  useEffect(() => {
    return () => {
      scanSessionRef.current += 1;

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  return (
    <div className="qr-scan-grid">
      <section className="panel dashboard-panel qr-scan-panel">
        <div className="panel-top">
          <div>
            <h2>Scan a physical GETH card</h2>
            <p className="section-copy">Use your camera to scan the QR code on a card and start the claim flow.</p>
          </div>
          <QrCode size={28} />
        </div>

        <div className="qr-camera-frame">
          <video ref={videoRef} playsInline muted />
          {!scanning ? (
            <div className="qr-camera-placeholder">
              <Camera size={44} />
              <strong>Camera scanner</strong>
              <p>Start the scanner and hold the QR code inside the frame.</p>
            </div>
          ) : null}
        </div>

        <div className="button-row">
          <button className="btn btn-primary" type="button" onClick={startScanner} disabled={scanning}>
            <Camera size={16} />
            {scanning ? "Scanning..." : "Start QR scan"}
          </button>
          <button className="btn btn-secondary" type="button" onClick={stopScanner} disabled={!scanning}>
            <XCircle size={16} />
            Stop camera
          </button>
        </div>

        <p className="section-copy" aria-live="polite">{status}</p>
      </section>

      <section className="panel dashboard-panel">
        <div className="panel-top">
          <div>
            <h2>Saved QR or manual entry</h2>
            <p className="section-copy">Scan a QR screenshot from your camera roll, paste the QR link, or enter a card slug such as verbinder.</p>
          </div>
          <ImageUp size={24} />
        </div>

        <div className="qr-upload-card">
          <input
            id="qr-image-upload"
            className="sr-only"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
          />
          <label className="btn btn-secondary" htmlFor="qr-image-upload">
            <ImageUp size={16} />
            {imageScanning ? "Reading image..." : "Scan from photo"}
          </label>
          <p>Works with screenshots, downloaded QR images, and photos from the camera roll.</p>
        </div>

        <div className="form-field">
          <label htmlFor="manual-qr-value">QR link or card slug</label>
          <input
            id="manual-qr-value"
            className="input"
            value={manualValue}
            onChange={(event) => setManualValue(event.target.value)}
            placeholder="https://.../claim-card/verbinder or verbinder"
          />
        </div>
        <button className="btn btn-dark" type="button" onClick={() => goToClaim(manualValue)}>
          <Keyboard size={16} />
          Continue to claim
        </button>
      </section>
    </div>
  );
}
