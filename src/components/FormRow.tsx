export function FormRow({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-xs uppercase font-bold text-gray-400">
        {label}
      </label>
      {children}
    </div>
  );
}
