import { gethCards } from "@/lib/cards";
import type { DemoRole } from "@/lib/demo-session";

export type DemoUser = {
  id: string;
  name: string;
  initials: string;
  team: string;
  role: DemoRole;
  email: string;
  cardsReceived: number;
  cardsGiven: number;
  trend: number;
  energy: "HOOG" | "GEMIDDELD" | "LAAG";
  topQuality: string;
};

export const demoUsers: Record<DemoRole, DemoUser> = {
  employee: {
    id: "u-sarah-employee",
    name: "Sarah van den Berg",
    initials: "SB",
    team: "Marketing Team",
    role: "employee",
    email: "sarah@geth-demo.com",
    cardsReceived: 15,
    cardsGiven: 7,
    trend: 5,
    energy: "HOOG",
    topQuality: "Uniter"
  },
  manager: {
    id: "u-sarah-manager",
    name: "Sarah Connors",
    initials: "SC",
    team: "Marketing Team",
    role: "manager",
    email: "sarah.connors@geth-demo.com",
    cardsReceived: 24,
    cardsGiven: 13,
    trend: 5,
    energy: "HOOG",
    topQuality: "Uniter"
  },
  company_admin: {
    id: "u-ali-admin",
    name: "Ali Ahmed",
    initials: "AA",
    team: "ABC Company",
    role: "company_admin",
    email: "ali@geth-demo.com",
    cardsReceived: 19,
    cardsGiven: 8,
    trend: 3,
    energy: "GEMIDDELD",
    topQuality: "Empathetic"
  },
  super_admin: {
    id: "u-geth-admin",
    name: "GETH Admin",
    initials: "GA",
    team: "Platform Team",
    role: "super_admin",
    email: "admin@geth.com",
    cardsReceived: 34,
    cardsGiven: 21,
    trend: 7,
    energy: "HOOG",
    topQuality: "Strategic"
  }
};

export const currentUser = demoUsers.employee;
export const managerUser = demoUsers.manager;
export const companyAdmin = demoUsers.company_admin;
export const superAdminUser = demoUsers.super_admin;

export const demoAccounts = [
  {
    id: "demo-employee",
    userId: demoUsers.employee.id,
    name: demoUsers.employee.name,
    initials: demoUsers.employee.initials,
    role: demoUsers.employee.role,
    email: demoUsers.employee.email,
    company: "ABC Company",
    badge: "Employee demo",
    description: "Explore the claim flow, personal dashboard, recent recognitions, and growth insights."
  },
  {
    id: "demo-manager",
    userId: demoUsers.manager.id,
    name: demoUsers.manager.name,
    initials: demoUsers.manager.initials,
    role: demoUsers.manager.role,
    email: demoUsers.manager.email,
    company: "ABC Company",
    badge: "Manager demo",
    description: "Review team activity, member trends, signals, and recognition impact across your team."
  },
  {
    id: "demo-company-admin",
    userId: demoUsers.company_admin.id,
    name: demoUsers.company_admin.name,
    initials: demoUsers.company_admin.initials,
    role: demoUsers.company_admin.role,
    email: demoUsers.company_admin.email,
    company: "ABC Company",
    badge: "Company admin",
    description: "Open the company workspace with employees, managers, reports, cards, and billing pages."
  },
  {
    id: "demo-super-admin",
    userId: demoUsers.super_admin.id,
    name: demoUsers.super_admin.name,
    initials: demoUsers.super_admin.initials,
    role: demoUsers.super_admin.role,
    email: demoUsers.super_admin.email,
    company: "GETH Platform",
    badge: "Platform admin",
    description: "Audit companies, subscriptions, QR routes, analytics, and the platform-wide card library."
  }
] as const;

export const people: DemoUser[] = [
  { id: "u-mark", name: "Mark de Vries", initials: "MV", team: "Marketing Team", role: "employee", email: "mark@geth-demo.com", cardsReceived: 18, cardsGiven: 6, trend: 3, energy: "HOOG", topQuality: "Uniter" },
  { id: "u-lisa", name: "Lisa Jansen", initials: "LJ", team: "Design Team", role: "employee", email: "lisa@geth-demo.com", cardsReceived: 21, cardsGiven: 3, trend: 6, energy: "HOOG", topQuality: "Supportive" },
  { id: "u-ali", name: "Ali Ahmed", initials: "AA", team: "Sales Team", role: "company_admin", email: "ali@geth-demo.com", cardsReceived: 15, cardsGiven: 5, trend: 2, energy: "GEMIDDELD", topQuality: "Empathetic" },
  { id: "u-tom", name: "Tom Bakker", initials: "TB", team: "Product Team", role: "employee", email: "tom@geth-demo.com", cardsReceived: 6, cardsGiven: 2, trend: -2, energy: "LAAG", topQuality: "Problem Solver" },
  { id: "u-john", name: "John Smith", initials: "JS", team: "Engineering Team", role: "employee", email: "john@geth-demo.com", cardsReceived: 9, cardsGiven: 4, trend: 1, energy: "GEMIDDELD", topQuality: "Clear Communicator" },
  { id: "u-peter", name: "Peter Mol", initials: "PM", team: "Support Team", role: "employee", email: "peter@geth-demo.com", cardsReceived: 4, cardsGiven: 1, trend: -1, energy: "LAAG", topQuality: "Patient" }
];

export const recognitions = [
  { id: "r1", from: "Jamie Miller", to: "Sarah van den Berg", card: "Uniter", category: "Communication", note: "You bring people together and spark great ideas.", date: "2h ago" },
  { id: "r2", from: "Mark Kim", to: "Sarah van den Berg", card: "Listener", category: "Communication", note: "You listen with care and make people feel heard.", date: "1d ago" },
  { id: "r3", from: "Aisha Verma", to: "Sarah van den Berg", card: "Supportive", category: "Collegiality", note: "You show up for your team and lift others up.", date: "3d ago" }
];

export const topQualities = [
  { label: "Uniter", value: 32, category: "Communication" },
  { label: "Supportive", value: 24, category: "Collegiality" },
  { label: "Problem Solver", value: 20, category: "Competence" },
  { label: "Clear Communicator", value: 14, category: "Communication" },
  { label: "Empathetic", value: 10, category: "Communication" }
];

export const employeeTopQualities = [
  { label: "Clear Communicator", tone: "var(--theme-sky)", count: 6 },
  { label: "Caring", tone: "var(--theme-purple-soft)", count: 4 },
  { label: "Goal-Oriented", tone: "var(--theme-gold)", count: 3 },
  { label: "Empathetic", tone: "var(--theme-sky)", count: 2 },
  { label: "Proactive", tone: "var(--theme-emerald)", count: 2 },
  { label: "Intuitive", tone: "var(--theme-ink-soft)", count: 1 }
];

export const employeeCategoryBreakdown = [
  { label: "Communication", value: 6, color: "var(--theme-sky)" },
  { label: "Creativity", value: 1, color: "var(--theme-emerald)" },
  { label: "Competence", value: 5, color: "var(--theme-gold)" },
  { label: "Collegiality", value: 3, color: "var(--theme-purple-soft)" }
];

export const employeeGrowthPoints = [26, 46, 36, 64, 56, 91];
export const managerTrendPoints = [56, 74, 96];
export const companyTrendThisQuarter = [112, 148, 186];
export const companyTrendLastQuarter = [74, 112, 146];
export const platformGrowthPoints = [120, 158, 194, 216];

export const teamSignals = [
  { id: "s1", tone: "var(--theme-red)", title: "Peter Mol hasn't received a card", detail: "in 9 weeks." },
  { id: "s2", tone: "var(--theme-gold)", title: "Tom Bakker hasn't received a card", detail: "in 6 weeks." },
  { id: "s3", tone: "var(--theme-sky)", title: "Lisa Jansen's recognition trend", detail: "is rising this quarter." },
  { id: "s4", tone: "var(--theme-emerald)", title: "Great team!", detail: "Your engagement score is above company average." }
];

export const employeeMessages = [
  { id: "m1", title: "Clear Communicator from Sarah Manager", excerpt: "Seed recognition for Jamie Miller.", time: "Today" },
  { id: "m2", title: "Uniter from Ali Ahmed", excerpt: "Thank you for keeping recognition visible.", time: "Yesterday" }
];

export const employeeNotifications = [
  { id: "n1", title: "Card claimed", detail: "Your Uniter recognition was successfully added to your profile.", time: "Just now" },
  { id: "n2", title: "Manager comment", detail: "Sarah Connors highlighted your empathy in team review notes.", time: "3h ago" },
  { id: "n3", title: "New card available", detail: "The Open Card route is active for custom recognitions.", time: "1d ago" }
];

export const companyCategoryShare = [
  { label: "Communication", value: 46, color: "var(--theme-ink)" },
  { label: "Competence", value: 28, color: "var(--theme-gold)" },
  { label: "Collegiality", value: 17, color: "var(--theme-emerald)" },
  { label: "Creativity", value: 10, color: "var(--theme-sky)" }
];

export const teamComparison = [
  { label: "Marketing", value: 124 },
  { label: "Sales", value: 98 },
  { label: "Product", value: 87 },
  { label: "Engineering", value: 76 },
  { label: "Support", value: 73 }
];

export const companyTeams = [
  { id: "t1", name: "Marketing", members: 18, manager: "Sarah Connors", engagement: "91%", recognitions: 124 },
  { id: "t2", name: "Sales", members: 14, manager: "Ali Ahmed", engagement: "86%", recognitions: 98 },
  { id: "t3", name: "Product", members: 11, manager: "Tom Bakker", engagement: "88%", recognitions: 87 },
  { id: "t4", name: "Engineering", members: 22, manager: "John Smith", engagement: "82%", recognitions: 76 }
];

export const companyEmployees = [
  { id: "e1", name: "Sarah van den Berg", role: "Employee", team: "Marketing", status: "Active", cards: 15 },
  { id: "e2", name: "Mark de Vries", role: "Employee", team: "Marketing", status: "Active", cards: 18 },
  { id: "e3", name: "Lisa Jansen", role: "Employee", team: "Design", status: "Active", cards: 21 },
  { id: "e4", name: "Tom Bakker", role: "Employee", team: "Product", status: "Needs attention", cards: 6 }
];

export const companyManagers = [
  { id: "cm1", name: "Sarah Connors", team: "Marketing", members: 8, score: "92%", report: "Strong momentum" },
  { id: "cm2", name: "Ali Ahmed", team: "Sales", members: 7, score: "88%", report: "Healthy collaboration" },
  { id: "cm3", name: "John Smith", team: "Engineering", members: 11, score: "79%", report: "Needs more recognition" }
];

export const companyReports = [
  { id: "cr1", title: "Quarterly engagement report", copy: "Review recognition density, active teams, and category share for Q3." },
  { id: "cr2", title: "Manager spotlight report", copy: "Compare manager-driven recognition cadence across departments." },
  { id: "cr3", title: "Retention signals", copy: "Flag employees with long recognition gaps and low energy scores." }
];

export const companies = [
  { id: "co1", name: "ABC Company", subscription: "Growth", status: "Active", employees: 142, teams: 18 },
  { id: "co2", name: "Northlight Studio", subscription: "Starter", status: "Trial", employees: 34, teams: 4 },
  { id: "co3", name: "Luma Health", subscription: "Enterprise", status: "Active", employees: 284, teams: 26 },
  { id: "co4", name: "Fieldhouse Group", subscription: "Growth", status: "Paused", employees: 68, teams: 9 }
];

export const subscriptions = [
  { id: "sub1", company: "ABC Company", plan: "Growth", renewal: "Aug 21, 2026", status: "Active" },
  { id: "sub2", company: "Northlight Studio", plan: "Starter", renewal: "Jul 18, 2026", status: "Trial" },
  { id: "sub3", company: "Luma Health", plan: "Enterprise", renewal: "Oct 01, 2026", status: "Active" },
  { id: "sub4", company: "Fieldhouse Group", plan: "Growth", renewal: "Paused", status: "Paused" }
];

export const qrRoutes = gethCards.slice(0, 8).map((card) => ({
  id: `qr-${card.id}`,
  slug: card.slug,
  title: card.title,
  destination: `/claim-card/${card.slug}`,
  status: card.active ? "Active" : "Inactive"
}));

export const platformMetrics = [
  { label: "Companies", value: "48" },
  { label: "Live subscriptions", value: "36" },
  { label: "Monthly recognitions", value: "12.8k" },
  { label: "Demo accounts", value: "14" }
];

export const cardManagementRows = gethCards.slice(0, 8).map((card) => ({
  id: card.id,
  title: card.title,
  category: card.category,
  number: String(card.cardNumber).padStart(2, "0"),
  sentence: card.recognitionSentence,
  status: card.active ? "Active" : "Inactive",
  slug: card.slug
}));
