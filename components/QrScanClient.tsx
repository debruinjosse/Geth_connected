"use client";

import jsQR from "jsqr";
import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Camera, CheckCircle2, ImageUp, Keyboard, QrCode, Send, XCircle } from "lucide-react";
import { gethCards, resolveCardSlug } from "@/lib/cards";

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

const MAX_DECODE_SIZE = 1280;
const CAMERA_DECODE_SCALES = [1, 1.2];
const IMAGE_DECODE_SCALES = [1, 1.35, 0.75, 1.75, 2];
const DECODE_ROTATIONS = [0, 90, 180, 270];
const VALID_LOCALES = new Set(["nl", "en"]);
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,80}$/i;
const CAMERA_CONSTRAINTS: MediaStreamConstraints[] = [
  {
    video: {
      facingMode: { exact: "environment" },
      height: { ideal: 1080 },
      width: { ideal: 1920 }
    },
    audio: false
  },
  {
    video: {
      facingMode: { ideal: "environment" },
      height: { ideal: 720 },
      width: { ideal: 1280 }
    },
    audio: false
  },
  {
    video: true,
    audio: false
  }
];

function getSlugCandidate(value: string | null | undefined) {
  let decoded = value ?? "";

  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    decoded = value ?? "";
  }

  const candidate = decoded.trim().replace(/[?#].*$/, "").replace(/^\/+|\/+$/g, "");
  return SLUG_PATTERN.test(candidate) ? candidate : "";
}

function normalizeSearchValue(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function resolveCardSearch(value: string) {
  const candidate = getSlugCandidate(value);
  const normalizedInput = normalizeSearchValue(value);
  const normalizedCardNumber = normalizedInput.replace(/^card/, "");

  if (!normalizedInput) return "";

  if (candidate) {
    const resolvedCandidate = resolveCardSlug(candidate);
    const exactSlug = gethCards.find((card) => card.active && card.slug === resolvedCandidate);
    if (exactSlug) return exactSlug.slug;
  }

  const activeCards = gethCards.filter((card) => card.active);
  const exactMatch = activeCards.find((card) => {
    const slug = normalizeSearchValue(card.slug);
    const title = normalizeSearchValue(card.title);
    const number = String(card.cardNumber).padStart(2, "0");
    return (
      slug === normalizedInput ||
      title === normalizedInput ||
      String(card.cardNumber) === normalizedInput ||
      String(card.cardNumber) === normalizedCardNumber ||
      number === normalizedInput ||
      number === normalizedCardNumber
    );
  });

  if (exactMatch) return exactMatch.slug;

  const startsWithMatch = activeCards.find((card) => {
    const slug = normalizeSearchValue(card.slug);
    const title = normalizeSearchValue(card.title);
    return slug.startsWith(normalizedInput) || title.startsWith(normalizedInput);
  });

  if (startsWithMatch) return startsWithMatch.slug;

  return activeCards.find((card) => {
    const slug = normalizeSearchValue(card.slug);
    const title = normalizeSearchValue(card.title);
    return slug.includes(normalizedInput) || title.includes(normalizedInput);
  })?.slug ?? "";
}

function resolveClaimSlug(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const slugFromPath = (pathname: string) => {
    const parts = pathname.split("/").filter(Boolean);
    const claimIndex = parts.findIndex((part) => part === "claim-card");

    if (claimIndex < 0) return "";
    return getSlugCandidate(parts[claimIndex + 1]);
  };

  const slugFromSearch = (searchParams: URLSearchParams) => {
    for (const key of ["slug", "card", "cardSlug", "card_slug", "qr", "qrSlug", "qr_slug"]) {
      const slug = getSlugCandidate(searchParams.get(key));

      if (slug) return slug;
    }

    return "";
  };

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const pathSlug = slugFromPath(url.pathname);
      const querySlug = slugFromSearch(url.searchParams);
      const hashSlug = getSlugCandidate(url.hash.replace(/^#/, ""));
      const pathParts = url.pathname.split("/").filter(Boolean);
      const looseCardsSlug = pathParts.some((part) => part === "cards") ? getSlugCandidate(pathParts.at(-1)) : "";

      return pathSlug || querySlug || hashSlug || looseCardsSlug;
    } catch {
      return "";
    }
  }

  const withoutQuery = trimmed.replace(/[?#].*$/, "").replace(/^\/+/, "");
  const parts = withoutQuery.split("/").filter(Boolean);
  const [firstPart, secondPart, thirdPart] = parts;

  if (VALID_LOCALES.has(firstPart) && secondPart === "give-card") {
    return getSlugCandidate(thirdPart);
  }

  if (firstPart === "give-card") {
    return getSlugCandidate(secondPart);
  }

  if (VALID_LOCALES.has(firstPart) && secondPart === "claim-card") {
    return getSlugCandidate(thirdPart);
  }

  if (firstPart === "claim-card") {
    return getSlugCandidate(secondPart);
  }

  if (VALID_LOCALES.has(firstPart) && secondPart === "cards") {
    return getSlugCandidate(thirdPart);
  }

  if (firstPart === "cards") {
    return getSlugCandidate(secondPart);
  }

  if (parts.length === 1) {
    const queryStyleMatch = firstPart.match(/^(?:slug|card|cardSlug|card_slug|qr|qrSlug|qr_slug)=(.+)$/i);
    return resolveCardSearch(queryStyleMatch?.[1] ?? firstPart);
  }

  return "";
}

export function QrScanClient() {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const t = useTranslations("qrScan");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectorRef = useRef<InstanceType<BarcodeDetectorConstructor> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scanSessionRef = useRef(0);
  const [manualValue, setManualValue] = useState("");
  const [status, setStatus] = useState(t("ready"));
  const [scanning, setScanning] = useState(false);
  const [imageScanning, setImageScanning] = useState(false);
  const [detectedSlug, setDetectedSlug] = useState("");
  const [detectedSource, setDetectedSource] = useState<"qr_scan" | "manual_entry">("manual_entry");
  const [decodedRaw, setDecodedRaw] = useState("");

  const locale = typeof params.locale === "string" ? params.locale : "en";

  async function requestCameraStream() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("camera_unsupported");
    }

    let lastError: unknown = null;

    for (const constraints of CAMERA_CONSTRAINTS) {
      try {
        return await navigator.mediaDevices.getUserMedia(constraints);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error ? lastError : new Error("camera_unavailable");
  }

  function waitForVideoReady(video: HTMLVideoElement) {
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error("video_timeout"));
      }, 5000);

      const cleanup = () => {
        window.clearTimeout(timeout);
        video.removeEventListener("loadedmetadata", handleReady);
        video.removeEventListener("canplay", handleReady);
        video.removeEventListener("error", handleError);
      };

      const handleReady = () => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          cleanup();
          resolve();
        }
      };

      const handleError = () => {
        cleanup();
        reject(new Error("video_error"));
      };

      video.addEventListener("loadedmetadata", handleReady);
      video.addEventListener("canplay", handleReady);
      video.addEventListener("error", handleError);
    });
  }

  function getCanvas() {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }

    return canvasRef.current;
  }

  function drawSourceToCanvas(source: CanvasImageSource, sourceWidth: number, sourceHeight: number, scaleMultiplier = 1) {
    if (!sourceWidth || !sourceHeight) return null;

    const scale = Math.min(1, MAX_DECODE_SIZE / Math.max(sourceWidth, sourceHeight)) * scaleMultiplier;
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

  function drawRotatedImage(image: HTMLImageElement, rotation: number, scale = 1) {
    const sourceWidth = image.naturalWidth;
    const sourceHeight = image.naturalHeight;
    if (!sourceWidth || !sourceHeight) return null;

    const rotated = rotation === 90 || rotation === 270;
    const baseWidth = rotated ? sourceHeight : sourceWidth;
    const baseHeight = rotated ? sourceWidth : sourceHeight;
    const fittedScale = Math.min(1, MAX_DECODE_SIZE / Math.max(baseWidth, baseHeight)) * scale;
    const width = Math.max(1, Math.round(baseWidth * fittedScale));
    const height = Math.max(1, Math.round(baseHeight * fittedScale));
    const canvas = getCanvas();
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) return null;

    canvas.width = width;
    canvas.height = height;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.translate(width / 2, height / 2);
    context.rotate((rotation * Math.PI) / 180);
    const drawWidth = Math.round(sourceWidth * fittedScale);
    const drawHeight = Math.round(sourceHeight * fittedScale);
    context.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    context.setTransform(1, 0, 0, 1, 0, 0);

    return canvas;
  }

  async function decodeQrFromCanvas(canvas: HTMLCanvasElement) {
    const nativeResult = await detectWithNativeScanner(canvas);
    if (nativeResult) return nativeResult;

    return detectWithJsQr(canvas);
  }

  async function decodeQrFromImage(image: HTMLImageElement) {
    for (const rotation of DECODE_ROTATIONS) {
      for (const scale of IMAGE_DECODE_SCALES) {
        const canvas = drawRotatedImage(image, rotation, scale);
        if (!canvas) continue;

        const code = await decodeQrFromCanvas(canvas);
        if (code) return code;
      }
    }

    return "";
  }

  async function detectQrFromVideo(video: HTMLVideoElement) {
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return "";
    if (!video.videoWidth || !video.videoHeight) return "";

    const nativeResult = await detectWithNativeScanner(video);
    if (nativeResult) return nativeResult;

    for (const scale of CAMERA_DECODE_SCALES) {
      const canvas = drawSourceToCanvas(video, video.videoWidth, video.videoHeight, scale);
      if (!canvas) continue;

      const code = await decodeQrFromCanvas(canvas);
      if (code) return code;
    }

    return "";
  }

  function stopScanLoop() {
    scanSessionRef.current += 1;

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }

  const detectedCard = detectedSlug ? gethCards.find((card) => card.slug === detectedSlug) : null;

  function handleDecodedQr(rawValue: string) {
    const trimmed = rawValue.trim();
    if (!trimmed) return;

    const slug = resolveClaimSlug(trimmed) || resolveCardSearch(trimmed);
    if (slug) {
      resolveDetectedCard(slug, "qr_scan");
      return;
    }

    setDetectedSlug("");
    setDecodedRaw(trimmed);
    setManualValue(trimmed);
    setStatus(t("qrDecoded", { value: trimmed.length > 120 ? `${trimmed.slice(0, 120)}…` : trimmed }));
    stopScanner();
  }

  function resolveDetectedCard(rawValue: string, source: "qr_scan" | "manual_entry" = "manual_entry") {
    const slug = resolveClaimSlug(rawValue) || resolveCardSearch(rawValue);
    if (!slug) {
      setDecodedRaw("");
      setStatus(t("notFound"));
      return;
    }

    setDecodedRaw("");
    setDetectedSlug(slug);
    setDetectedSource(source);
    setManualValue(slug);
    setStatus(t("found"));
    stopScanner();
  }

  function goToClaim(slug = detectedSlug) {
    if (!slug) {
      setStatus(t("searchFirst"));
      return;
    }

    router.push(`/${locale}/claim-card/${encodeURIComponent(slug)}?source=${detectedSource}`);
  }

  function goToGiveDigitally(slug = detectedSlug) {
    if (!slug) {
      setStatus(t("searchFirst"));
      return;
    }

    router.push(`/${locale}/give-card/${encodeURIComponent(slug)}`);
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

      if (!window.isSecureContext && window.location.hostname !== "localhost") {
        setStatus(t("needsHttps"));
        return;
      }

      setStatus(t("requesting"));
      const stream = await requestCameraStream();
      streamRef.current = stream;
      setScanning(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.muted = true;
        await videoRef.current.play();
        await waitForVideoReady(videoRef.current);
      }

      setStatus(t("cameraReady"));
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
              handleDecodedQr(code);
              return;
            }
          } catch {
            setStatus(t("paused"));
          } finally {
            decoding = false;
          }
        }

        animationFrameRef.current = window.requestAnimationFrame(tick);
      };

      animationFrameRef.current = window.requestAnimationFrame(tick);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const permissionText = /denied|permission|notallowed/i.test(message)
        ? t("blocked")
        : t("unavailable");

      setStatus(permissionText);
      setScanning(false);
    }
  }

  function loadImageFromFile(file: File) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => resolve(image);
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("image_load_failed"));
      };
      image.src = objectUrl;
      image.dataset.objectUrl = objectUrl;
    });
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (!file) return;

    stopScanner();
    setImageScanning(true);
    setStatus(t("readingImage"));

    let image: HTMLImageElement | null = null;

    try {
      image = await loadImageFromFile(file);

      const code = await decodeQrFromImage(image);

      if (code) {
        handleDecodedQr(code);
        return;
      }

      setStatus(t("noQrInImage"));
    } catch {
      setStatus(t("imageUnreadable"));
    } finally {
      if (image?.dataset.objectUrl) URL.revokeObjectURL(image.dataset.objectUrl);
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
      <section className="panel dashboard-panel qr-scan-panel qr-camera-panel">
        <div className="panel-top">
          <div>
            <h2>{t("cameraTitle")}</h2>
            <p className="section-copy">{t("cameraCopy")}</p>
          </div>
          <QrCode size={28} />
        </div>

        <div className="qr-camera-frame">
          <video ref={videoRef} autoPlay playsInline muted className={scanning ? "is-active" : ""} />
          {!scanning ? (
            <div className="qr-camera-placeholder">
              <Camera size={44} />
              <strong>{t("cameraScanner")}</strong>
              <p>{t("cameraHint")}</p>
            </div>
          ) : null}
        </div>

        <div className="button-row">
          <button className="btn btn-primary" type="button" onClick={startScanner} disabled={scanning}>
            <Camera size={16} />
            {scanning ? t("scanning") : t("startScan")}
          </button>
          <button className="btn btn-secondary" type="button" onClick={stopScanner} disabled={!scanning}>
            <XCircle size={16} />
            {t("stopCamera")}
          </button>
        </div>

        <p className="section-copy" aria-live="polite">{status}</p>
      </section>

      <section className="panel dashboard-panel qr-manual-claim-panel">
        <div className="panel-top">
          <div>
            <h2>{t("exploreTitle")}</h2>
            <p className="section-copy">{t("exploreCopy")}</p>
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
            {imageScanning ? t("readingImageBtn") : t("scanFromPhoto")}
          </label>
          <p>{t("uploadHint")}</p>
        </div>

        <div className="form-field">
          <label htmlFor="manual-qr-value">{t("searchCard")}</label>
          <input
            id="manual-qr-value"
            className="input"
            value={manualValue}
            onChange={(event) => {
              setManualValue(event.target.value);
              setDetectedSlug("");
            }}
            placeholder={t("searchPlaceholder")}
          />
        </div>
        <button className="btn btn-dark" type="button" onClick={() => resolveDetectedCard(manualValue, "manual_entry")}>
          <Keyboard size={16} />
          {t("findCard")}
        </button>

        {decodedRaw && !detectedSlug ? (
          <div className="qr-detected-card qr-detected-raw" role="status" aria-live="polite">
            <div>
              <CheckCircle2 size={18} />
              <span>{t("qrDecoded", { value: decodedRaw.length > 120 ? `${decodedRaw.slice(0, 120)}…` : decodedRaw })}</span>
            </div>
            {/^https?:\/\//i.test(decodedRaw) ? (
              <a className="btn btn-secondary" href={decodedRaw} target="_blank" rel="noreferrer">
                Open scanned link
              </a>
            ) : null}
          </div>
        ) : null}

        {detectedSlug ? (
          <div className="qr-detected-card" role="status" aria-live="polite">
            <div>
              <CheckCircle2 size={18} />
              <span>{t("cardReady")}</span>
            </div>
            <strong>{detectedCard?.title ?? detectedSlug}</strong>
            <p>{t("chooseHow")}</p>
            <div className="qr-detected-actions">
              <button className="btn btn-primary" type="button" onClick={() => goToClaim()}>
                <QrCode size={16} />
                {t("claimCard")}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => goToGiveDigitally()}>
                <Send size={16} />
                {t("giveDigitally")}
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
