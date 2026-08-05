"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4">
      <h2 className="text-lg font-semibold text-destructive">
        Terjadi kesalahan
      </h2>
      <p className="text-sm text-muted-foreground">
        {error.message || "Gagal memuat halaman."}
      </p>
      <Button onClick={reset} variant="outline">
        Coba Lagi
      </Button>
    </div>
  );
}
