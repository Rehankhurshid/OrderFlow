import { Settings } from "lucide-react";
import ChangePasswordForm from "@/components/change-password-form";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Settings className="h-7 w-7" />
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </div>

      <div className="grid gap-6">
        <div className="flex justify-center">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}