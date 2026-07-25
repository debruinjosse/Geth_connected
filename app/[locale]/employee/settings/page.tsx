import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

export default async function EmployeeSettingsPage() {
  const locale = await getLocale();
  redirect(`/${locale}/employee/profile`);
}
