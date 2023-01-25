export function FormRow({
  id,
  label,
  children,
  errorMessage,
}: {
  id: string;
  label: string;
  errorMessage?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-xs uppercase font-bold text-gray-400">
        {label}
      </label>
      {children}
      {errorMessage && (
        <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
      )}
    </div>
  );
}
