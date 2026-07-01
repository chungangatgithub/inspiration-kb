import { CaptureForm } from '@/components/capture/CaptureForm';

export default function CapturePage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <h1 className="text-xl font-semibold text-center mb-6">捕获灵感</h1>
      <CaptureForm />
    </main>
  );
}
