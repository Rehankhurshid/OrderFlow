import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, AlertTriangle, Plus, ArrowRight, Check } from "lucide-react";
import Header from "@/components/layout/header";
import { useAuth } from "@/hooks/use-auth";
import DoViewTable from "@/components/do/do-view-table";
import type { DeliveryOrderWithParty } from "@shared/schema";

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
  const { user } = useAuth();
  const isRoleCreator = user?.department === "role_creator";

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentDOs, isLoading: recentLoading } = useQuery({
    queryKey: ["/api/delivery-orders/my-department"],
  });

  const { data: allDOs, isLoading: allDOsLoading } = useQuery<DeliveryOrderWithParty[]>({
    queryKey: ["/api/delivery-orders/all"],
    enabled: isRoleCreator,
  });

  const { data: processedDOs, isLoading: processedDOsLoading } = useQuery<DeliveryOrderWithParty[]>({
    queryKey: ["/api/delivery-orders/processed"],
  });

  const { data: pendingDOs, isLoading: pendingDOsLoading } = useQuery<DeliveryOrderWithParty[]>({
    queryKey: ["/api/delivery-orders/pending"],
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Total DOs</p>
                {statsLoading ? (
                  <Skeleton className="h-6 md:h-8 w-12 md:w-16 mt-1 md:mt-2" />
                ) : (
                  <p className="text-xl md:text-2xl font-semibold text-gray-900">{stats?.total || 0}</p>
                )}
              </div>
              <div className="hidden sm:flex w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg items-center justify-center">
                <FileText className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">In Progress</p>
                {statsLoading ? (
                  <Skeleton className="h-6 md:h-8 w-12 md:w-16 mt-1 md:mt-2" />
                ) : (
                  <p className="text-xl md:text-2xl font-semibold text-gray-900">{stats?.inProgress || 0}</p>
                )}
              </div>
              <div className="hidden sm:flex w-10 h-10 md:w-12 md:h-12 bg-yellow-100 rounded-lg items-center justify-center">
                <Clock className="h-5 w-5 md:h-6 md:w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Completed</p>
                {statsLoading ? (
                  <Skeleton className="h-6 md:h-8 w-12 md:w-16 mt-1 md:mt-2" />
                ) : (
                  <p className="text-xl md:text-2xl font-semibold text-gray-900">{stats?.completed || 0}</p>
                )}
              </div>
              <div className="hidden sm:flex w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg items-center justify-center">
                <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Pending</p>
                {statsLoading ? (
                  <Skeleton className="h-6 md:h-8 w-12 md:w-16 mt-1 md:mt-2" />
                ) : (
                  <p className="text-xl md:text-2xl font-semibold text-gray-900">{stats?.pending || 0}</p>
                )}
              </div>
              <div className="hidden sm:flex w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-lg items-center justify-center">
                <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DO Management Tabs */}
      <Tabs defaultValue={isRoleCreator ? "all" : "pending"} className="space-y-4">
        <TabsList className={`grid w-full max-w-[600px] ${isRoleCreator ? 'grid-cols-3' : 'grid-cols-3'}`}>
          {isRoleCreator && (
            <TabsTrigger value="all" className="flex items-center space-x-2">
              <span>All DOs</span>
              {allDOs && allDOs.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {allDOs.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger value="pending" className="flex items-center space-x-2">
            <span>Pending Action</span>
            {pendingDOs && pendingDOs.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingDOs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="processed" className="flex items-center space-x-2">
            <span>Processed/Forwarded</span>
            {processedDOs && processedDOs.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {processedDOs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center space-x-2">
            <span>Recent Activity</span>
          </TabsTrigger>
        </TabsList>

        {isRoleCreator && (
          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Delivery Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {allDOsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : allDOs && allDOs.length > 0 ? (
                  <DoViewTable deliveryOrders={allDOs} isLoading={allDOsLoading} showCurrentLocation={true} />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No delivery orders found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Action</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingDOsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : pendingDOs && pendingDOs.length > 0 ? (
                <DoViewTable deliveryOrders={pendingDOs} isLoading={pendingDOsLoading} showCurrentLocation={true} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No pending delivery orders</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processed/Forwarded Delivery Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {processedDOsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : processedDOs && processedDOs.length > 0 ? (
                <DoViewTable deliveryOrders={processedDOs} isLoading={processedDOsLoading} showCurrentLocation={true} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No processed delivery orders found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
