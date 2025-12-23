import { SettingsForm } from "@/components/SettingsForm";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { ExportData } from "@/components/ExportData";
import { getCurrentUser } from "@/lib/get-user-id";

// Mark page as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

async function getUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export default async function SettingsPage() {
  const user = await getUser();

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 bg-gray-50 min-h-screen">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SettingsForm user={user} />
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <ChangePasswordForm />
            </div>
            <ExportData />
          </div>
        </div>
      </div>
    </div>
  );
}

