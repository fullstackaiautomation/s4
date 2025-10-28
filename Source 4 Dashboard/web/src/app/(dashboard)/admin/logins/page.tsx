import { SectionHeader } from "@/components/section-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";

export default function LoginsPage() {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="User & Access Controls"
        description="Manage authentication, roles, and access policies."
        badge="Coming Soon"
      />

      <InlineAlert
        title="Planned Feature"
        message="Role-based access control and multi-user onboarding are scheduled for a future release."
        variant="info"
      />

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Upcoming Capabilities</CardTitle>
            <CardDescription>Snapshot of the RBAC roadmap.</CardDescription>
          </div>
        </CardHeader>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Define roles for Admin, Executive, Sales Rep, and Marketing Analyst personas.</li>
          <li>• Assign page-level permissions and data access scopes per role.</li>
          <li>• Integrate with Supabase Auth providers and enforce MFA requirements.</li>
        </ul>
      </Card>
    </div>
  );
}
