interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Loading" }: LoadingScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-yellow-50">
      <div className="flex flex-col items-center">
        <img
          src="https://ewnjlwwtpuzcbskypoue.supabase.co/storage/v1/object/public/assets/eggy-fighting.gif"
          alt="Loading"
          className="h-32 w-auto object-contain"
        />
        <p className="mt-4 text-lg font-medium text-gray-700">{message}</p>
      </div>
    </div>
  );
}
