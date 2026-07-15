import { Suspense } from "react";
import DiscoverEventsContent from "./DiscoverEventsContent";

export default function DiscoverEventsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-gray-600">Carregando...</p>
        </div>
      }
    >
      <DiscoverEventsContent />
    </Suspense>
  );
}
