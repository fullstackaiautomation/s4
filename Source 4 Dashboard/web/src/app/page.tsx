import DashboardLayout from "./(dashboard)/layout";
import LandingDashboard from "./(dashboard)/dashboards/landing/landing-dashboard";

export const dynamic = 'force-dynamic';

export default async function Home() {
  return (
    <DashboardLayout>
      <LandingDashboard />
    </DashboardLayout>
  );
}
