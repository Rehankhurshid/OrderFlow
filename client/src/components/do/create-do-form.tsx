import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { insertDeliveryOrderSchema, type Party } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const createDoSchema = insertDeliveryOrderSchema.extend({
  validFrom: z.string().min(1, "Valid from date is required"),
  validUntil: z.string().min(1, "Valid until date is required"),
}).refine((data) => {
  const fromDate = new Date(data.validFrom);
  const untilDate = new Date(data.validUntil);
  return untilDate > fromDate;
}, {
  message: "Valid until date must be after valid from date",
  path: ["validUntil"],
});

type CreateDoFormData = z.infer<typeof createDoSchema>;

export default function CreateDoForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: parties, isLoading: partiesLoading } = useQuery<Party[]>({
    queryKey: ["/api/parties"],
  });

  const form = useForm<CreateDoFormData>({
    resolver: zodResolver(createDoSchema),
    defaultValues: {
      partyId: "",
      authorizedPerson: "",
      validFrom: "",
      validUntil: "",
      notes: "",
    },
  });

  const createDoMutation = useMutation({
    mutationFn: async (data: CreateDoFormData) => {
      const formattedData = {
        ...data,
        validFrom: new Date(data.validFrom).toISOString(),
        validUntil: new Date(data.validUntil).toISOString(),
      };
      const res = await apiRequest("POST", "/api/delivery-orders", formattedData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Delivery Order created and submitted to Project Office",
      });
      form.reset();
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

  const onSubmit = (data: CreateDoFormData) => {
    createDoMutation.mutate(data);
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Delivery Order</CardTitle>
        <p className="text-sm text-gray-600">
          Fill out the form below to create a new delivery order. It will be automatically submitted to the Project Office for review.
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">DO Number</label>
                <Input 
                  value="Auto-generated" 
                  disabled 
                  className="bg-gray-50"
                />
                <p className="text-sm text-gray-500 mt-1">System will auto-generate DO number</p>
              </div>

              <FormField
                control={form.control}
                name="partyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Party Name *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Party" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {partiesLoading ? (
                          <SelectItem value="" disabled>Loading parties...</SelectItem>
                        ) : parties?.length === 0 ? (
                          <SelectItem value="" disabled>No parties available</SelectItem>
                        ) : (
                          parties?.map((party) => (
                            <SelectItem key={party.id} value={party.id}>
                              {party.partyName} ({party.partyNumber})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="validFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid From *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="validUntil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid Until *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="authorizedPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Authorized Person *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter authorized person's name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter any additional notes or special instructions"
                          rows={4}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => form.reset()}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createDoMutation.isPending}
              >
                {createDoMutation.isPending 
                  ? "Creating..." 
                  : "Create & Submit to Project Office"
                }
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
