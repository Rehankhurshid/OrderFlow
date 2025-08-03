import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Eye, Check, X, Calendar, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
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
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'receive' | 'dispatch' | null>(null);
  const [remarks, setRemarks] = useState("");
  const [receiveDate, setReceiveDate] = useState("");
  const [receiveTime, setReceiveTime] = useState("");
  const [forwardDate, setForwardDate] = useState("");
  const [forwardTime, setForwardTime] = useState("");

  const processDoMutation = useMutation({
    mutationFn: async ({ id, action, remarks }: { id: string; action: 'approve' | 'reject' | 'receive' | 'dispatch'; remarks: string }) => {
      const res = await apiRequest("POST", `/api/delivery-orders/${id}/${action}`, { remarks });
      return await res.json();
    },
    onSuccess: () => {
      const actionMessages: Record<string, string> = {
        approve: 'approved',
        reject: 'rejected',
        receive: 'marked as received',
        dispatch: 'dispatched'
      };
      toast({
        title: "Success",
        description: `Delivery Order ${actionMessages[actionType || 'processed']} successfully`,
      });
      setSelectedDo(null);
      setActionType(null);
      setRemarks("");
      // Invalidate all relevant queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-orders/my-department"] });
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-orders/processed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-orders/project-office/created"] });
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-orders/project-office/received"] });
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-orders/project-office/forwarded"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAction = (do_: DeliveryOrderWithParty, action: 'approve' | 'reject' | 'receive' | 'dispatch') => {
    setSelectedDo(do_);
    setActionType(action);
    
    const now = new Date();
    
    // Set default date and time for receive action
    if (action === 'receive') {
      setReceiveDate(format(now, "yyyy-MM-dd"));
      setReceiveTime(format(now, "HH:mm"));
    }
    
    // Set default date and time for Area Office forwarding to Road Sale
    if (action === 'approve' && user?.department === 'area_office') {
      setForwardDate(format(now, "yyyy-MM-dd"));
      setForwardTime(format(now, "HH:mm"));
    }
  };

  const confirmAction = () => {
    if (selectedDo && actionType) {
      let finalRemarks = remarks;
      
      // Add received timestamp to remarks if action is receive
      if (actionType === 'receive' && receiveDate && receiveTime) {
        const receivedAt = new Date(`${receiveDate}T${receiveTime}`);
        finalRemarks = `${remarks ? remarks + ' - ' : ''}Received on ${format(receivedAt, "PPP 'at' p")}`;
      }
      
      // Add forward timestamp to remarks if Area Office is forwarding to Road Sale
      if (actionType === 'approve' && user?.department === 'area_office' && forwardDate && forwardTime) {
        const forwardedAt = new Date(`${forwardDate}T${forwardTime}`);
        finalRemarks = `${remarks ? remarks + ' - ' : ''}Forwarded to Road Sale on ${format(forwardedAt, "PPP 'at' p")}`;
      }
      
      processDoMutation.mutate({
        id: selectedDo.id,
        action: actionType,
        remarks: finalRemarks,
      });
    }
  };

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

  // Separate received and pending orders
  const receivedOrders = deliveryOrders.filter(
    do_ => do_.currentStatus === "received_at_project_office"
  );
  const pendingOrders = deliveryOrders.filter(
    do_ => do_.currentStatus !== "received_at_project_office"
  );

  return (
    <>
      <div className="space-y-6">
        {/* Pending Orders Section */}
        {pendingOrders.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Pending Orders</h3>
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
                  {pendingOrders.map((do_) => (
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
                              {user?.department === 'project_office' && do_.currentStatus === 'at_project_office' && (
                                <Button 
                                  size="sm" 
                                  onClick={() => handleAction(do_, 'receive')}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Mark as Received
                                </Button>
                              )}
                              {user?.department === 'project_office' && do_.currentStatus === 'received_at_project_office' && (
                                <Button 
                                  size="sm" 
                                  onClick={() => handleAction(do_, 'dispatch')}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Mark as Dispatched
                                </Button>
                              )}
                              {user?.department !== 'project_office' || do_.currentStatus === 'dispatched_from_project_office' ? (
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
                              ) : (
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => handleAction(do_, 'reject')}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Received Orders Section */}
        {receivedOrders.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Received Orders (Pending Dispatch)</h3>
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
                  {receivedOrders.map((do_) => (
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
                                onClick={() => handleAction(do_, 'dispatch')}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Forward to Area Office
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
          </div>
        )}
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
              {actionType === 'approve' ? 'Approve' : 
               actionType === 'reject' ? 'Reject' :
               actionType === 'receive' ? 'Mark as Received' :
               actionType === 'dispatch' ? 'Forward to Area Office' : ''} Delivery Order
            </DialogTitle>
            <DialogDescription>
              {selectedDo && `${selectedDo.doNumber} - ${selectedDo.party.partyName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {actionType === 'receive' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="receive-date">Date</Label>
                    <Input
                      id="receive-date"
                      type="date"
                      value={receiveDate}
                      onChange={(e) => setReceiveDate(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="receive-time">Time</Label>
                    <Input
                      id="receive-time"
                      type="time"
                      value={receiveTime}
                      onChange={(e) => setReceiveTime(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>
              </>
            )}
            {actionType === 'approve' && user?.department === 'area_office' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="forward-date">Forward Date</Label>
                    <Input
                      id="forward-date"
                      type="date"
                      value={forwardDate}
                      onChange={(e) => setForwardDate(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="forward-time">Forward Time</Label>
                    <Input
                      id="forward-time"
                      type="time"
                      value={forwardTime}
                      onChange={(e) => setForwardTime(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>
              </>
            )}
            <div>
              <Label htmlFor="remarks">Remarks (optional)</Label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter any remarks or comments"
                className="mt-2"
              />
            </div>
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
                : actionType === 'approve' ? 'Approve' : 
                  actionType === 'reject' ? 'Reject' :
                  actionType === 'receive' ? 'Mark as Received' :
                  actionType === 'dispatch' ? 'Forward to Area Office' : ''
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
