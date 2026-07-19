"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PROFILE_PHOTOS_BUCKET = "profile-photos";
const MAX_PROFILE_PHOTO_BYTES = 50 * 1024 * 1024;
const ALLOWED_PROFILE_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function getSafeReturnPath(value: FormDataEntryValue | null) {
  const path = String(value ?? "").trim();
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/api") || path.startsWith("/auth")) {
    return "/dashboard";
  }

  return path;
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

function getProfilePhotoExtension(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (extension && ["jpg", "jpeg", "png", "webp", "gif"].includes(extension)) {
    return extension === "jpeg" ? "jpg" : extension;
  }

  switch (file.type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

async function ensureProfilePhotosBucket() {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.storage.createBucket(PROFILE_PHOTOS_BUCKET, {
    public: true,
    fileSizeLimit: MAX_PROFILE_PHOTO_BYTES,
    allowedMimeTypes: Array.from(ALLOWED_PROFILE_PHOTO_TYPES)
  });

  if (error && !/already exists/i.test(error.message)) {
    throw error;
  }

  return admin;
}

async function tryEnsureProfilePhotosBucket() {
  try {
    await ensureProfilePhotosBucket();
  } catch {
    // The normal upload path uses authenticated storage policies. Bucket creation
    // is best-effort for local/dev environments that still have a service role key.
  }
}

export async function updateOwnProfileNameAction(formData: FormData) {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const returnTo = getSafeReturnPath(formData.get("returnTo"));

  if (!firstName) {
    redirect(`${returnTo}?settings=first-name-required`);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { error } = await supabase.rpc("update_own_profile_name", {
    first_name_input: firstName,
    last_name_input: lastName
  });

  if (error) {
    redirect(`${returnTo}?settings=profile-update-failed`);
  }

  revalidatePath(returnTo);
  redirect(`${returnTo}?settings=profile-updated`);
}

export async function updateOwnProfilePhotoAction(formData: FormData) {
  const returnTo = getSafeReturnPath(formData.get("returnTo"));
  const photo = formData.get("profilePhoto");

  if (!(photo instanceof File) || photo.size === 0) {
    redirect(`${returnTo}?settings=profile-photo-required`);
  }

  if (photo.size > MAX_PROFILE_PHOTO_BYTES) {
    redirect(`${returnTo}?settings=profile-photo-too-large`);
  }

  if (!ALLOWED_PROFILE_PHOTO_TYPES.has(photo.type)) {
    redirect(`${returnTo}?settings=profile-photo-invalid`);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  try {
    const extension = getProfilePhotoExtension(photo);
    const objectPath = `profiles/${user.id}/${Date.now()}-${randomUUID()}.${extension}`;
    const buffer = Buffer.from(await photo.arrayBuffer());

    let uploadResult = await supabase.storage.from(PROFILE_PHOTOS_BUCKET).upload(objectPath, buffer, {
      contentType: photo.type,
      cacheControl: "3600",
      upsert: false
    });

    if (uploadResult.error && /bucket|not found|does not exist/i.test(uploadResult.error.message)) {
      await tryEnsureProfilePhotosBucket();
      uploadResult = await supabase.storage.from(PROFILE_PHOTOS_BUCKET).upload(objectPath, buffer, {
        contentType: photo.type,
        cacheControl: "3600",
        upsert: false
      });
    }

    if (uploadResult.error) {
      throw uploadResult.error;
    }

    const { data: publicUrlData } = supabase.storage.from(PROFILE_PHOTOS_BUCKET).getPublicUrl(objectPath);
    const { error: updateError } = await supabase.rpc("update_own_profile_photo", {
      profile_image_input: publicUrlData.publicUrl
    });

    if (updateError) {
      throw updateError;
    }
  } catch {
    redirect(`${returnTo}?settings=profile-photo-failed`);
  }

  revalidatePath(returnTo);
  redirect(`${returnTo}?settings=profile-photo-updated`);
}

export async function sendPasswordResetFromSettingsAction(formData: FormData) {
  const returnTo = getSafeReturnPath(formData.get("returnTo"));
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    redirect(`${returnTo}?settings=reset-email-failed`);
  }

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${getAppUrl()}/auth/callback?next=/reset-password`
  });

  if (error) {
    redirect(`${returnTo}?settings=reset-email-failed`);
  }

  redirect(`${returnTo}?settings=reset-email-sent`);
}
