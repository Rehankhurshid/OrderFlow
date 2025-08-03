import Header from "@/components/layout/header";
import DoSearch from "@/components/do/do-search";

export default function SearchDoPage() {
  return (
    <div className="space-y-6">
      <Header 
        title="Consumer Portal" 
        subtitle="Search for delivery orders and check their status"
      />
      <DoSearch />
    </div>
  );
}
