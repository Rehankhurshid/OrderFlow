import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Calendar, Building2, LogIn } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import type { DeliveryOrderWithParty, Party, WorkflowHistoryWithPerformer } from "@shared/schema";

const statusMap = {
  "created": "Created",
  "at_project_office": "At Project Office",
  "received_at_project_office": "Received at Project Office",
  "dispatched_from_project_office": "Dispatched from Project Office",
  "at_area_office": "At Area Office",
  "at_road_sale": "At Road Sale",
  "completed": "Completed",
  "rejected": "Rejected",
};

const statusColorMap: Record<string, string> = {
  "created": "bg-gray-100 text-gray-800",
  "at_project_office": "bg-blue-100 text-blue-800",
  "received_at_project_office": "bg-indigo-100 text-indigo-800",
  "dispatched_from_project_office": "bg-purple-100 text-purple-800",
  "at_area_office": "bg-yellow-100 text-yellow-800",
  "at_road_sale": "bg-orange-100 text-orange-800",
  "completed": "bg-green-100 text-green-800",
  "rejected": "bg-red-100 text-red-800",
};

type DeliveryOrderWithHistory = DeliveryOrderWithParty & {
  workflowHistory?: WorkflowHistoryWithPerformer[];
};

export function ConsumerPortalPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedParty, setSelectedParty] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDO, setSelectedDO] = useState<DeliveryOrderWithHistory | null>(null);

  // Fetch delivery orders
  const { data: deliveryOrders = [], isLoading: doLoading } = useQuery<DeliveryOrderWithParty[]>({
    queryKey: [`/api/public/delivery-orders?status=${selectedStatus}&party=${selectedParty}&doNumber=${searchQuery}`],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch parties for filter
  const { data: parties = [] } = useQuery<Party[]>({
    queryKey: ['/api/public/parties'],
  });

  const filteredOrders = deliveryOrders;

  const handleRowClick = async (order: DeliveryOrderWithParty) => {
    // Fetch detailed DO with workflow history
    try {
      const response = await fetch(`/api/delivery-orders/search/${order.doNumber}`);
      if (response.ok) {
        const detailedOrder = await response.json();
        setSelectedDO(detailedOrder);
      } else {
        // If detailed fetch fails, still show basic info
        setSelectedDO(order);
      }
    } catch (error) {
      // If fetch fails, still show basic info
      setSelectedDO(order);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                <span className="hidden sm:inline">Delivery Order Tracking Portal</span>
                <span className="sm:hidden">DO Tracking</span>
              </h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-1 sm:space-x-2"
                onClick={() => window.location.href = '/login'}
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Staff Login</span>
                <span className="sm:hidden">Login</span>
              </Button>
              <Badge variant="outline" className="text-xs sm:text-sm">
                Public Access
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Search Delivery Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search by DO Number - Full width on mobile */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by DO Number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters - 2 columns on mobile, 3 on tablet+ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Filter by Party */}
                <Select value={selectedParty} onValueChange={setSelectedParty}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Parties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Parties</SelectItem>
                    {parties.map((party) => (
                      <SelectItem key={party.id} value={party.partyName}>
                        {party.partyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Filter by Status */}
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {Object.entries(statusMap).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Reset Filters */}
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedParty("all");
                    setSelectedStatus("all");
                  }}
                  className="sm:col-span-2 lg:col-span-1"
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-base sm:text-lg">Delivery Orders</CardTitle>
              <Badge variant="secondary" className="text-xs sm:text-sm">
                {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {doLoading ? (
              <div className="text-center py-8 text-gray-500">Loading delivery orders...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No delivery orders found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">DO Number</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Party Name</TableHead>
                      <TableHead className="text-xs sm:text-sm">Status</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden md:table-cell">Current Location</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Valid From</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Valid Until</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden md:table-cell">Created On</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow 
                        key={order.id} 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleRowClick(order)}
                      >
                        <TableCell className="font-medium text-xs sm:text-sm">
                          <div>
                            {order.doNumber}
                            <div className="sm:hidden text-xs text-gray-500 mt-1">
                              {order.party.partyName}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm hidden sm:table-cell">
                          {order.party.partyName}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <Badge className={`${statusColorMap[order.currentStatus]} text-xs`}>
                            <span className="hidden sm:inline">{statusMap[order.currentStatus]}</span>
                            <span className="sm:hidden">{statusMap[order.currentStatus].split(' ')[0]}</span>
                          </Badge>
                          <div className="md:hidden text-xs text-gray-500 mt-1 capitalize">
                            {order.currentLocation.replace(/_/g, ' ')}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm hidden md:table-cell capitalize">
                          {order.currentLocation.replace(/_/g, ' ')}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm hidden lg:table-cell">
                          {format(new Date(order.validFrom), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm hidden lg:table-cell">
                          {format(new Date(order.validUntil), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                          {format(new Date(order.createdAt), 'dd MMM yyyy')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* DO Details Dialog */}
      <Dialog open={!!selectedDO} onOpenChange={() => setSelectedDO(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delivery Order Details</DialogTitle>
          </DialogHeader>
          {selectedDO && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm text-gray-600 mb-1">DO Number</h3>
                  <p className="text-base font-medium">{selectedDO.doNumber}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-600 mb-1">Current Status</h3>
                  <Badge className={statusColorMap[selectedDO.currentStatus]}>
                    {statusMap[selectedDO.currentStatus]}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-600 mb-1">Party Name</h3>
                  <p className="text-base">{selectedDO.party.partyName}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-600 mb-1">Current Location</h3>
                  <p className="text-base capitalize">{selectedDO.currentLocation.replace(/_/g, ' ')}</p>
                </div>
              </div>

              {/* Validity Period */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-sm text-gray-600 mb-3">Validity Period</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Valid From</p>
                      <p className="text-base">{format(new Date(selectedDO.validFrom), 'dd MMM yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Valid Until</p>
                      <p className="text-base">{format(new Date(selectedDO.validUntil), 'dd MMM yyyy')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-sm text-gray-600 mb-3">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Authorized Person</p>
                    <p className="text-base">{selectedDO.authorizedPerson}</p>
                  </div>
                  {selectedDO.notes && (
                    <div>
                      <p className="text-sm text-gray-600">Notes</p>
                      <p className="text-base">{selectedDO.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-sm text-gray-600 mb-3">Timeline</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Created On</span>
                    <span className="text-sm">{format(new Date(selectedDO.createdAt), 'dd MMM yyyy, HH:mm')}</span>
                  </div>
                </div>
              </div>

              {/* Workflow Progress */}
              {selectedDO.workflowHistory && selectedDO.workflowHistory.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-sm text-gray-600 mb-3">Workflow History</h3>
                  <div className="space-y-3">
                    {selectedDO.workflowHistory.map((history, index) => (
                      <div key={index} className="flex items-start space-x-3 text-sm">
                        <div className="w-2 h-2 bg-primary rounded-full mt-1.5"></div>
                        <div className="flex-1">
                          <p className="font-medium">{history.action.replace(/_/g, ' ').toUpperCase()}</p>
                          <p className="text-gray-600">
                            {history.fromDepartment ? 
                              `From ${history.fromDepartment.replace(/_/g, ' ')} to ${history.toDepartment.replace(/_/g, ' ')}` :
                              `To ${history.toDepartment.replace(/_/g, ' ')}`
                            }
                          </p>
                          {history.remarks && (
                            <p className="text-gray-500 mt-1">Remarks: {history.remarks}</p>
                          )}
                          <p className="text-gray-400 text-xs mt-1">
                            {format(new Date(history.performedAt), 'dd MMM yyyy, HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
