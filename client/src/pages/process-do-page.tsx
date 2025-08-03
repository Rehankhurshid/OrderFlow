import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import DoTable from "@/components/do/do-table";
import DoViewTable from "@/components/do/do-view-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { DeliveryOrderWithParty } from "@shared/schema";

export default function ProcessDoPage() {
  const { user } = useAuth();
  const isProjectOffice = user?.department === "project_office";

  // Common queries for all departments
  const { data: currentOrders, isLoading: isLoadingCurrent } = useQuery<DeliveryOrderWithParty[]>({
    queryKey: ["/api/delivery-orders/my-department"],
  });

  const { data: processedOrders, isLoading: isLoadingProcessed } = useQuery<DeliveryOrderWithParty[]>({
    queryKey: ["/api/delivery-orders/processed"],
  });

  // Project Office specific queries
  const { data: createdDOs, isLoading: createdLoading } = useQuery<DeliveryOrderWithParty[]>({
    queryKey: ["/api/delivery-orders/project-office/created"],
    enabled: isProjectOffice,
  });

  const { data: receivedDOs, isLoading: receivedLoading } = useQuery<DeliveryOrderWithParty[]>({
    queryKey: ["/api/delivery-orders/project-office/received"],
    enabled: isProjectOffice,
  });

  const { data: forwardedDOs, isLoading: forwardedLoading } = useQuery<DeliveryOrderWithParty[]>({
    queryKey: ["/api/delivery-orders/project-office/forwarded"],
    enabled: isProjectOffice,
  });

  const getSubtitle = () => {
    const subtitles: Record<string, string> = {
      project_office: "DOs received from Paper Creator department",
      area_office: "DOs received from Project Office department", 
      road_sale: "DOs received from Area Office department",
    };
    return subtitles[user?.department || ""] || "DOs for processing";
  };

  // Render 3 tabs for Project Office
  if (isProjectOffice) {
    return (
      <div className="space-y-6">
        <Header 
          title="Process Delivery Orders" 
          subtitle={getSubtitle()}
        />

        <Tabs defaultValue="created" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="created" className="flex items-center space-x-2">
              <span>Created</span>
              {createdDOs && createdDOs.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {createdDOs.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="received" className="flex items-center space-x-2">
              <span>Received</span>
              {receivedDOs && receivedDOs.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {receivedDOs.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="forwarded" className="flex items-center space-x-2">
              <span>Forwarded</span>
              {forwardedDOs && forwardedDOs.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {forwardedDOs.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="created" className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Created Delivery Orders</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {createdDOs?.length || 0} DOs that were just submitted by Paper Creator
                </p>
              </div>
              
              <div className="p-6">
                <DoTable deliveryOrders={createdDOs || []} isLoading={createdLoading} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="received" className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Received Delivery Orders</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {receivedDOs?.length || 0} DOs marked as received and ready to dispatch
                </p>
              </div>
              
              <div className="p-6">
                <DoTable deliveryOrders={receivedDOs || []} isLoading={receivedLoading} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="forwarded" className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Forwarded Delivery Orders</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {forwardedDOs?.length || 0} DOs that have been dispatched to Area Office
                </p>
              </div>
              
              <div className="p-6">
                {!forwardedLoading && forwardedDOs?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No forwarded delivery orders yet</p>
                  </div>
                ) : (
                  <DoViewTable deliveryOrders={forwardedDOs || []} isLoading={forwardedLoading} showCurrentLocation={true} />
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Default 2 tabs for other departments
  return (
    <div className="space-y-6">
      <Header 
        title="Process Delivery Orders" 
        subtitle={getSubtitle()}
      />

      <Tabs defaultValue="current" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="current" className="flex items-center space-x-2">
            <span>Current</span>
            {currentOrders && currentOrders.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {currentOrders.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="processed" className="flex items-center space-x-2">
            <span>Processed</span>
            {processedOrders && processedOrders.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {processedOrders.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Current Delivery Orders</h3>
              <p className="text-sm text-gray-600 mt-1">
                {currentOrders?.length || 0} DOs waiting for your action
              </p>
            </div>
            
            <div className="p-6">
              <DoTable deliveryOrders={currentOrders || []} isLoading={isLoadingCurrent} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="processed" className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Processed Delivery Orders</h3>
              <p className="text-sm text-gray-600 mt-1">
                {processedOrders?.length || 0} DOs you have processed/forwarded
              </p>
            </div>
            
            <div className="p-6">
              {!isLoadingProcessed && processedOrders?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No processed delivery orders yet</p>
                </div>
              ) : (
                <DoViewTable deliveryOrders={processedOrders || []} isLoading={isLoadingProcessed} showCurrentLocation={true} />
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
