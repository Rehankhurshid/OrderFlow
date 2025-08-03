import Header from "@/components/layout/header";
import CreateDoForm from "@/components/do/create-do-form";

export default function CreateDoPage() {
  return (
    <div className="space-y-6">
      <Header 
        title="Create Delivery Order" 
        subtitle="Create a new delivery order and submit to Project Office"
      />
      <CreateDoForm />
    </div>
  );
}
