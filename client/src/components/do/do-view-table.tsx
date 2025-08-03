import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Eye } from "lucide-react";
import { format } from "date-fns";
import type { DeliveryOrderWithParty } from "@shared/schema";

interface DoViewTableProps {
  deliveryOrders: DeliveryOrderWithParty[];
  isLoading: boolean;
  showCurrentLocation?: boolean;
}

export default function DoViewTable({ deliveryOrders, isLoading, showCurrentLocation = true }: DoViewTableProps) {
  const [selectedDo, setSelectedDo] = useState<DeliveryOrderWithParty | null>(null);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      created: { variant: "secondary", label: "Created" },
      at_project_office: { variant: "default", label: "At Project Office" },
      received_at_project_office: { variant: "default", label: "Received at Project Office" },
      dispatched_from_project_office: { variant: "default", label: "Dispatched from Project Office" },
      at_area_office: { variant: "default", label: "At Area Office" },
      at_road_sale: { variant: "default", label: "At Road Sale" },
      completed: { variant: "outline", label: "Completed" },
      rejected: { variant: "destructive", label: "Rejected" },
    };

    const config = statusConfig[status] || { variant: "secondary" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getLocationBadge = (location: string) => {
    const locationConfig: Record<string, string> = {
      paper_creator: "Paper Creator",
      project_office: "Project Office",
      area_office: "Area Office",
      road_sale: "Road Sale",
    };

    return (
      <Badge variant="outline">
        {locationConfig[location] || location}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (deliveryOrders.length === 0) {
    return null;
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>DO Number</TableHead>
              <TableHead>Party Name</TableHead>
              <TableHead>Authorized Person</TableHead>
              <TableHead>Validity</TableHead>
              <TableHead>Status</TableHead>
              {showCurrentLocation && <TableHead>Current Location</TableHead>}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliveryOrders.map((do_) => (
              <TableRow key={do_.id}>
                <TableCell className="font-medium">{do_.doNumber}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{do_.party.partyName}</div>
                    <div className="text-sm text-gray-500">Party ID: {do_.party.partyNumber}</div>
                  </div>
                </TableCell>
                <TableCell>{do_.authorizedPerson}</TableCell>
                <TableCell>
                  {new Date(do_.validUntil).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {getStatusBadge(do_.currentStatus)}
                </TableCell>
                {showCurrentLocation && (
                  <TableCell>
                    {getLocationBadge(do_.currentLocation)}
                  </TableCell>
                )}
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Delivery Order Details</DialogTitle>
                        <DialogDescription>
                          {do_.doNumber} - {do_.party.partyName}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4 py-4">
                        <div>
                          <Label className="font-medium">Party Name</Label>
                          <p>{do_.party.partyName} ({do_.party.partyNumber})</p>
                        </div>
                        <div>
                          <Label className="font-medium">Authorized Person</Label>
                          <p>{do_.authorizedPerson}</p>
                        </div>
                        <div>
                          <Label className="font-medium">Valid From</Label>
                          <p>{new Date(do_.validFrom).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <Label className="font-medium">Valid Until</Label>
                          <p>{new Date(do_.validUntil).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <Label className="font-medium">Current Status</Label>
                          <p>{getStatusBadge(do_.currentStatus)}</p>
                        </div>
                        <div>
                          <Label className="font-medium">Current Location</Label>
                          <p>{getLocationBadge(do_.currentLocation)}</p>
                        </div>
                        <div>
                          <Label className="font-medium">Created By</Label>
                          <p>{do_.creator.username}</p>
                        </div>
                        <div>
                          <Label className="font-medium">Created At</Label>
                          <p>{format(new Date(do_.createdAt), "PPP 'at' p")}</p>
                        </div>
                        {do_.notes && (
                          <div className="col-span-2">
                            <Label className="font-medium">Notes</Label>
                            <p className="text-sm text-gray-600">{do_.notes}</p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
