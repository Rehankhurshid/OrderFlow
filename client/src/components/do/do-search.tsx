import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import WorkflowProgress from "@/components/do/workflow-progress";
import type { DeliveryOrderWithParty, WorkflowHistoryWithPerformer } from "@shared/schema";

interface SearchResult extends DeliveryOrderWithParty {
  workflowHistory: WorkflowHistoryWithPerformer[];
}

export default function DoSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

  const searchMutation = useMutation({
    mutationFn: async (doNumber: string) => {
      const res = await apiRequest("GET", `/api/delivery-orders/search/${doNumber}`);
      return await res.json();
    },
    onSuccess: (data) => {
      setSearchResult(data);
    },
    onError: () => {
      setSearchResult(null);
    },
  });

  const handleSearch = () => {
    if (searchTerm.trim()) {
      searchMutation.mutate(searchTerm.trim());
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      created: { variant: "secondary", label: "Created" },
      at_project_office: { variant: "default", label: "At Project Office" },
      at_area_office: { variant: "default", label: "At Area Office" },
      at_road_sale: { variant: "default", label: "At Road Sale" },
      completed: { variant: "outline", label: "Completed" },
      rejected: { variant: "destructive", label: "Rejected" },
    };

    const config = statusConfig[status] || { variant: "secondary" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCurrentLocationBadge = (location: string) => {
    const locationConfig: Record<string, { variant: "default" | "secondary", label: string }> = {
      paper_creator: { variant: "secondary", label: "Paper Creator" },
      project_office: { variant: "default", label: "At Project Office" },
      area_office: { variant: "default", label: "At Area Office" },
      road_sale: { variant: "default", label: "At Road Sale Office" },
    };

    const config = locationConfig[location] || { variant: "secondary" as const, label: location };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Search Delivery Order</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter DO Number (e.g., DO-2024-001)"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button 
              onClick={handleSearch}
              disabled={searchMutation.isPending || !searchTerm.trim()}
            >
              <Search className="h-4 w-4 mr-2" />
              {searchMutation.isPending ? "Searching..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchMutation.isError && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delivery Order Not Found</h3>
              <p className="text-gray-600">
                The DO number "{searchTerm}" could not be found. Please check the number and try again.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {searchResult && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            {/* DO Details Card */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h5 className="text-lg font-semibold text-gray-900">{searchResult.doNumber}</h5>
                  <p className="text-gray-600">{searchResult.party.partyName} ({searchResult.party.partyNumber})</p>
                </div>
                {getCurrentLocationBadge(searchResult.currentLocation)}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-700">Authorized Person</p>
                  <p className="text-sm text-gray-900">{searchResult.authorizedPerson}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Validity Period</p>
                  <p className="text-sm text-gray-900">
                    {new Date(searchResult.validFrom).toLocaleDateString()} - {new Date(searchResult.validUntil).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Current Status</p>
                  <div className="mt-1">{getStatusBadge(searchResult.currentStatus)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Created Date</p>
                  <p className="text-sm text-gray-900">{new Date(searchResult.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {searchResult.notes && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700">Notes</p>
                  <p className="text-sm text-gray-900 mt-1">{searchResult.notes}</p>
                </div>
              )}
              
              {/* Workflow Progress */}
              <WorkflowProgress 
                currentStatus={searchResult.currentStatus}
                currentLocation={searchResult.currentLocation}
              />
              
              {/* Activity History */}
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Activity History</p>
                <div className="space-y-3">
                  {searchResult.workflowHistory.map((history) => (
                    <div key={history.id} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm text-gray-900">
                          {history.action.replace(/_/g, ' ')} 
                          {history.fromDepartment && history.toDepartment && 
                            ` from ${history.fromDepartment.replace(/_/g, ' ')} to ${history.toDepartment.replace(/_/g, ' ')}`
                          }
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(history.performedAt).toLocaleString()} • By: {history.performer.username}
                        </p>
                        {history.remarks && (
                          <p className="text-xs text-gray-600 mt-1">Remarks: {history.remarks}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
