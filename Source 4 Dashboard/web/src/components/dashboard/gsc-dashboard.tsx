import { GSCDashboardClient } from "./gsc-dashboard-client";
import {
    getGSCOverview,
    getGSCTopQueries,
    getGSCTopPages,
    getGSCDeviceBreakdown,
    getGSCDailyPerformance
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
        deviceBreakdown,
        dailyPerformance
    ] = await Promise.all([
        getGSCOverview({ startDate, endDate }),
        getGSCTopQueries({ startDate, endDate }),
        getGSCTopPages({ startDate, endDate }),
        getGSCDeviceBreakdown({ startDate, endDate }),
        getGSCDailyPerformance({ startDate, endDate })
    ]);

    return (
        <GSCDashboardClient
            overview={overview}
            topQueries={topQueries}
            topPages={topPages}
            deviceBreakdown={deviceBreakdown}
            dailyPerformance={dailyPerformance}
            currentStartDate={startDate}
            currentEndDate={endDate}
        />
    );
}
