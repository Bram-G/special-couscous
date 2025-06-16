import ProtectedRoute from "@/components/protectedRoute";
import DashboardPage from "@/components/Dashboard/DashboardPage";

export default function DocsPage() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  );
}
