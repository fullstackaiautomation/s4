import { GSCDashboardClient } from "./gsc-dashboard-client";
import {
    getGSCOverview,
    getGSCTopQueries,
    getGSCTopPages,
    getGSCDeviceBreakdown
} from "@/lib/data-service";

export default async function GSCDashboard() {
    const [
        overview,
        topQueries,
        topPages,
        deviceBreakdown
    ] = await Promise.all([
        getGSCOverview(),
        getGSCTopQueries(),
        getGSCTopPages(),
        getGSCDeviceBreakdown()
    ]);

    return (
        <GSCDashboardClient
            overview={overview}
            topQueries={topQueries}
            topPages={topPages}
            deviceBreakdown={deviceBreakdown}
        />
    );
}
