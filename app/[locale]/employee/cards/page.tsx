import { CardsHistoryView } from "@/components/employee/CardsHistoryView";

export default async function EmployeeCardsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <CardsHistoryView locale={locale} role="employee" />;
}
