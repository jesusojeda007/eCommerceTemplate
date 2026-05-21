import config from '../../../client.config'

export function Footer() {
  return (
    <footer className="border-t bg-muted/40 mt-auto">
      <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} {config.name}. Todos los derechos reservados.</p>
      </div>
    </footer>
  )
}
