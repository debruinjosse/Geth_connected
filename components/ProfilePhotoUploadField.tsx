"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Camera } from "lucide-react";

export function ProfilePhotoUploadField() {
  const t = useTranslations("profilePhotoUpload");
  const [fileName, setFileName] = useState("");

  return (
    <div className="profile-photo-upload-block">
      <label className="profile-photo-upload">
        <Camera size={16} />
        <span>{fileName ? t("changePhoto") : t("choosePhoto")}</span>
        <input
          type="file"
          name="profilePhoto"
          accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,image/*"
          required
          onChange={(event) => setFileName(event.currentTarget.files?.[0]?.name ?? "")}
        />
      </label>
      <p className={`profile-photo-upload-hint${fileName ? " selected" : ""}`}>
        {fileName ? t("selected", { name: fileName }) : t("noPhotoSelected")}
      </p>
    </div>
  );
}
