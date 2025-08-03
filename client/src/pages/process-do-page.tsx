import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import DoTable from "@/components/do/do-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DeliveryOrderWithParty } from "@shared/schema";

export default function ProcessDoPage() {
  const { user } = useAuth();

  const { data: deliveryOrders, isLoading } = useQuery<DeliveryOrderWithParty[]>({
    queryKey: ["/api/delivery-orders/my-department"],
  });

  const getSubtitle = () => {
    const subtitles: Record<string, string> = {
      project_office: "DOs received from Paper Creator department",
      area_office: "DOs received from Project Office department", 
      road_sale: "DOs received from Area Office department",
    };
    return subtitles[user?.department || ""] || "DOs for processing";
  };

  return (
    <div className="space-y-6">
      <Header 
        title="Process Delivery Orders" 
        subtitle={getSubtitle()}
      />

      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Delivery Orders</h3>
            <p className="text-sm text-gray-600 mt-1">
              {deliveryOrders?.length || 0} DOs waiting for your action
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="ready">Ready to Process</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="p-6">
          <DoTable deliveryOrders={deliveryOrders || []} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
