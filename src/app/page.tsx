import { AppStateProvider } from '@/context/AppStateContext';
import { UploadSection } from './UploadSection';

export default function Home(): React.JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 font-sans dark:bg-zinc-950">
      <main className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Document Automation
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Upload your documents to extract and auto-fill form data
          </p>
        </div>

        <AppStateProvider>
          <UploadSection />
        </AppStateProvider>
      </main>
    </div>
  );
}
