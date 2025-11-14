import DashboardLayout from "./(dashboard)/layout";
import SalesDashboard from "./(dashboard)/dashboards/sales/sales-dashboard";

export const dynamic = 'force-dynamic';

export default async function Home() {
  return (
    <DashboardLayout>
      <SalesDashboard />
    </DashboardLayout>
  );
}
