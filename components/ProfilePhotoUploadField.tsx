"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Camera } from "lucide-react";

/** Dashed drop-area style file picker for the profile photo. */
export function ProfilePhotoUploadField() {
  const t = useTranslations("profilePhotoUpload");
  const [fileName, setFileName] = useState("");

  return (
    <label className="lp-upload">
      <Camera aria-hidden="true" />
      <span>
        <b>{fileName ? t("changePhoto") : t("choosePhoto")}</b>
        <small>{fileName ? t("selected", { name: fileName }) : t("noPhotoSelected")}</small>
      </span>
      <input
        type="file"
        name="profilePhoto"
        accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,image/*"
        required
        onChange={(event) => setFileName(event.currentTarget.files?.[0]?.name ?? "")}
      />
    </label>
  );
}
