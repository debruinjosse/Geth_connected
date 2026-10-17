/**
 * Public company details shown on the marketing site. LinkedIn and KvK (Dutch Chamber of
 * Commerce) are read from env so they can be set per deployment without a code change;
 * anything left empty is simply not rendered.
 */
export const siteConfig = {
  contactEmail: "info@geth.pro",
  linkedinUrl: process.env.NEXT_PUBLIC_LINKEDIN_URL?.trim() || "https://www.linkedin.com/company/130334524/",
  kvkNumber: process.env.NEXT_PUBLIC_KVK_NUMBER?.trim() || ""
};
