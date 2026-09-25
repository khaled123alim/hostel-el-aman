import { Logo } from "@/components/shared/logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md px-4">
        <div className="card-surface overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/60 px-7 py-6">
            <div className="mx-auto flex justify-center">
              <Logo />
            </div>
            <h1 className="heading-lg mt-4 text-center">{title}</h1>
            {subtitle && <p className="mt-1 text-center text-sm text-ink-soft">{subtitle}</p>}
          </div>
          <div className="px-7 py-6">{children}</div>
          {footer && <div className="border-t border-slate-100 bg-slate-50/60 px-7 py-4">{footer}</div>}
        </div>
      </div>
    </div>
  );
}