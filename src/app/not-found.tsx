import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary-50">
      <div className="flex flex-col items-center gap-4">
        <h1 className="font-lato text-6xl font-bold text-primary-600">404</h1>
        <p className="font-inter text-base text-neutral-600">
          Página não encontrada
        </p>
        <Link
          href="/"
          className="font-inter text-base font-medium text-primary-500 hover:text-primary-700 underline-offset-4 hover:underline"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
