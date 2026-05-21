'use client'

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h2 className="text-2xl font-semibold mb-4">Algo salió mal</h2>
      <p className="text-muted-foreground mb-6">{error.message ?? 'Error inesperado'}</p>
      <button
        onClick={reset}
        className="bg-[var(--brand-primary)] text-white px-6 py-2 rounded"
      >
        Intentar de nuevo
      </button>
    </div>
  )
}
