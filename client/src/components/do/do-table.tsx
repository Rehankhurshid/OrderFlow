import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Eye, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { DeliveryOrderWithParty } from "@shared/schema";

interface DoTableProps {
  deliveryOrders: DeliveryOrderWithParty[];
  isLoading: boolean;
}

export default function DoTable({ deliveryOrders, isLoading }: DoTableProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDo, setSelectedDo] = useState<DeliveryOrderWithParty | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [remarks, setRemarks] = useState("");

  const processDoMutation = useMutation({
    mutationFn: async ({ id, action, remarks }: { id: string; action: 'approve' | 'reject'; remarks: string }) => {
      const res = await apiRequest("POST", `/api/delivery-orders/${id}/${action}`, { remarks });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Delivery Order ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`,
      });
      setSelectedDo(null);
      setActionType(null);
      setRemarks("");
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAction = (do_: DeliveryOrderWithParty, action: 'approve' | 'reject') => {
    setSelectedDo(do_);
    setActionType(action);
  };

  const confirmAction = () => {
    if (selectedDo && actionType) {
      processDoMutation.mutate({
        id: selectedDo.id,
        action: actionType,
        remarks,
      });
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

  const canProcessDo = (do_: DeliveryOrderWithParty) => {
    return do_.currentLocation === user?.department && !['completed', 'rejected'].includes(do_.currentStatus);
  };

  const getActionText = () => {
    const actionMap: Record<string, string> = {
      project_office: "Forward to Area Office",
      area_office: "Forward to Road Sale Office", 
      road_sale: "Mark as Completed",
    };
    return actionMap[user?.department || ""] || "Process";
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
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No delivery orders found for your department</p>
      </div>
    );
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
                <TableCell>
                  <div className="flex space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
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
                            <Label className="font-medium">Created By</Label>
                            <p>{do_.creator.username}</p>
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

                    {canProcessDo(do_) && (
                      <>
                        <Button 
                          size="sm" 
                          onClick={() => handleAction(do_, 'approve')}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          {getActionText()}
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleAction(do_, 'reject')}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Action Confirmation Dialog */}
      <Dialog 
        open={!!selectedDo && !!actionType} 
        onOpenChange={() => {
          setSelectedDo(null);
          setActionType(null);
          setRemarks("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve' : 'Reject'} Delivery Order
            </DialogTitle>
            <DialogDescription>
              {selectedDo && `${selectedDo.doNumber} - ${selectedDo.party.partyName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="remarks">Remarks (optional)</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter any remarks or comments"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedDo(null);
                setActionType(null);
                setRemarks("");
              }}
            >
              Cancel
            </Button>
            <Button 
              variant={actionType === 'approve' ? 'default' : 'destructive'}
              onClick={confirmAction}
              disabled={processDoMutation.isPending}
            >
              {processDoMutation.isPending 
                ? 'Processing...' 
                : actionType === 'approve' ? 'Approve' : 'Reject'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
