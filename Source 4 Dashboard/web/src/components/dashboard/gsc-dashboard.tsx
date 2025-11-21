import { GSCDashboardClient } from "./gsc-dashboard-client";
import {
    getGSCOverview,
    getGSCTopQueries,
    getGSCTopPages,
    getGSCDeviceBreakdown
} from "@/lib/data-service";

interface GSCDashboardProps {
    startDate?: string;
    endDate?: string;
}

export default async function GSCDashboard({ startDate, endDate }: GSCDashboardProps) {
    const [
        overview,
        topQueries,
        topPages,
        deviceBreakdown
    ] = await Promise.all([
        getGSCOverview({ startDate, endDate }),
        getGSCTopQueries({ startDate, endDate }),
        getGSCTopPages({ startDate, endDate }),
        getGSCDeviceBreakdown({ startDate, endDate })
    ]);

    return (
        <GSCDashboardClient
            overview={overview}
            topQueries={topQueries}
            topPages={topPages}
            deviceBreakdown={deviceBreakdown}
            currentStartDate={startDate}
            currentEndDate={endDate}
        />
    );
}
