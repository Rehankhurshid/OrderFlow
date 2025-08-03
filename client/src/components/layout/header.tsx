import { useAuth } from "@/hooks/use-auth";

interface HeaderProps {
  title: string;
  subtitle: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth();

  if (!user) return null;

  const departmentNames = {
    paper_creator: "Document Creation Dept.",
    project_office: "Project Office Dept.",
    area_office: "Area Office Dept.", 
    road_sale: "Road Sale Dept.",
    role_creator: "System Administration",
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* System Status */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm text-gray-600">System Online</span>
          </div>
          
          {/* User Info */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-medium">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">{user.username}</p>
              <p className="text-gray-600">
                {departmentNames[user.department as keyof typeof departmentNames]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
