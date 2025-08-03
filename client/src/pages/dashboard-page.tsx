import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Clock, CheckCircle, AlertTriangle, Plus, ArrowRight, Check } from "lucide-react";
import Header from "@/components/layout/header";

interface DashboardStats {
  total: number;
  inProgress: number;
  completed: number;
  pending: number;
}

interface RecentActivity {
  id: string;
  doNumber: string;
  partyName: string;
  action: string;
  performedAt: string;
  performer: string;
  type: 'created' | 'forwarded' | 'completed';
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentDOs, isLoading: recentLoading } = useQuery({
    queryKey: ["/api/delivery-orders/my-department"],
  });

  const getRecentActivity = (recentDOs: any[]): RecentActivity[] => {
    if (!recentDOs) return [];
    
    return recentDOs.slice(0, 5).map((do_: any) => ({
      id: do_.id,
      doNumber: do_.doNumber,
      partyName: do_.party.partyName,
      action: getActionText(do_.currentStatus),
      performedAt: new Date(do_.createdAt).toLocaleString(),
      performer: do_.creator.username,
      type: getActivityType(do_.currentStatus),
    }));
  };

  const getActionText = (status: string): string => {
    const statusTexts: Record<string, string> = {
      created: "Created",
      at_project_office: "At Project Office",
      at_area_office: "At Area Office", 
      at_road_sale: "At Road Sale Office",
      completed: "Completed",
      rejected: "Rejected",
    };
    return statusTexts[status] || status;
  };

  const getActivityType = (status: string): 'created' | 'forwarded' | 'completed' => {
    if (status === 'created') return 'created';
    if (status === 'completed') return 'completed';
    return 'forwarded';
  };

  const getActivityIcon = (type: 'created' | 'forwarded' | 'completed') => {
    switch (type) {
      case 'created':
        return <Plus className="text-blue-600" />;
      case 'forwarded':
        return <ArrowRight className="text-green-600" />;
      case 'completed':
        return <Check className="text-green-600" />;
    }
  };

  const getActivityBgColor = (type: 'created' | 'forwarded' | 'completed') => {
    switch (type) {
      case 'created':
        return 'bg-blue-100';
      case 'forwarded':
        return 'bg-green-100';
      case 'completed':
        return 'bg-green-100';
    }
  };

  const recentActivity = getRecentActivity(recentDOs as any[] || []);

  return (
    <div className="space-y-6">
      <Header 
        title="Dashboard" 
        subtitle="Overview of delivery orders and system activity"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total DOs</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16 mt-2" />
                ) : (
                  <p className="text-2xl font-semibold text-gray-900">{stats?.total || 0}</p>
                )}
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16 mt-2" />
                ) : (
                  <p className="text-2xl font-semibold text-gray-900">{stats?.inProgress || 0}</p>
                )}
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16 mt-2" />
                ) : (
                  <p className="text-2xl font-semibold text-gray-900">{stats?.completed || 0}</p>
                )}
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Action</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16 mt-2" />
                ) : (
                  <p className="text-2xl font-semibold text-gray-900">{stats?.pending || 0}</p>
                )}
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className={`w-10 h-10 ${getActivityBgColor(activity.type)} rounded-full flex items-center justify-center`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.doNumber} - {activity.action}
                    </p>
                    <p className="text-sm text-gray-600">
                      Party: {activity.partyName} • By: {activity.performer}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(activity.performedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
