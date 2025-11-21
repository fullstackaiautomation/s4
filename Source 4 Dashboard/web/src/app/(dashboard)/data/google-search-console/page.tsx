import GSCDashboard from "@/components/dashboard/gsc-dashboard";
import { SyncButton } from "@/components/dashboard/SyncButton";

export const metadata = {
    title: "Google Search Console | Source 4 Dashboard",
    description: "Organic search performance and visibility",
};

export default function GSCDashboardPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-end px-6 pt-6">
                <SyncButton endpoint="/api/sync/gsc" />
            </div>
            <GSCDashboard />
        </div>
    );
}
