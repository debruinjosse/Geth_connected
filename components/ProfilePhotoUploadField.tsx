"use client";

import { useState } from "react";
import { Camera } from "lucide-react";

export function ProfilePhotoUploadField() {
  const [fileName, setFileName] = useState("");

  return (
    <div className="profile-photo-upload-block">
      <label className="profile-photo-upload">
        <Camera size={16} />
        <span>{fileName ? "Change photo" : "Choose photo"}</span>
        <input
          type="file"
          name="profilePhoto"
          accept="image/jpeg,image/png,image/webp,image/gif"
          required
          onChange={(event) => setFileName(event.currentTarget.files?.[0]?.name ?? "")}
        />
      </label>
      <p className={`profile-photo-upload-hint${fileName ? " selected" : ""}`}>
        {fileName ? `Selected: ${fileName}. Now click Upload photo.` : "No photo selected yet. Choose a photo first, then upload it."}
      </p>
    </div>
  );
}
