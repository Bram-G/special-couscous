import { title } from "@/components/primitives";
import ProtectedRoute from "@/components/protectedRoute";
import DashboardPage from "@/components/DashboardPage";

export default function DocsPage() {
  return (
    <ProtectedRoute>
      <DashboardPage>
        
      </DashboardPage>
    </ProtectedRoute>
  );
}
