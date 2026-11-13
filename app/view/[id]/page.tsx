import { Suspense } from 'react';
import { ViewCVClient } from './ViewCVClient';
import { Loader2 } from 'lucide-react';

// Fallback component jo build ke waqt dikhega
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-blue-600" size={48} />
    </div>
  );
}

// Asal component jo params await karega
async function DynamicCVPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ViewCVClient id={id} />;
}

// Main Page component jo Suspense ke andar hai
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DynamicCVPage params={params} />
    </Suspense>
  );
}