import { cls } from "./cls";

export function Modal({
  open,
  children,
}: {
  open: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      aria-hidden="true"
      className={cls(
        "fixed inset-0 z-50 w-full p-4 overflow-x-hidden overflow-y-auto h-full bg-black/70",
        open ? "flex" : "hidden"
      )}
    >
      <div className="relative w-full h-full max-w-2xl md:h-auto m-auto">
        <div className="relative bg-gray-700 rounded-lg shadow">{children}</div>
      </div>
    </div>
  );
}