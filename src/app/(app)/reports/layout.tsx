import { ReportsNav } from "@/components/reports/reports-nav";

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden print:overflow-visible">
      <ReportsNav />
      <div className="flex-1 overflow-y-auto p-4 print:overflow-visible print:p-0 sm:p-6">{children}</div>
    </div>
  );
}
