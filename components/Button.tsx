import Link from "next/link";
import { cls } from "./cls";

export function DeleteButton({ children, ...props }: ButtonProps) {
  return (
    <Button
      icon={
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
          />
        </svg>
      }
      {...props}
    >
      {children}
    </Button>
  );
}

export function UserButton({ children, ...props }: ButtonProps) {
  return (
    <Button
      icon={
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      }
      {...props}
    >
      {children}
    </Button>
  );
}

export function AddButton({ children, ...props }: ButtonProps) {
  return (
    <Button
      icon={
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      }
      {...props}
    >
      {children}
    </Button>
  );
}

interface LinkButtonProps {
  children: React.ReactNode;
  btnType?: ButtonType;
  href: string;
}

export function LinkButton({ children, btnType, href }: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cls(
        "flex items-center text-white disabled:cursor-not-allowed disabled:bg-gray-500 focus:ring-2 font-medium rounded-lg text-sm px-3 py-2.5 focus:outline-none",
        btnType === "primary" &&
          "bg-rose-700 hover:bg-rose-800 focus:ring-rose-300",
        btnType === "secondary" &&
          "bg-gray-800 hover:bg-gray-900 focus:ring-gray-400"
      )}
    >
      {children}
    </Link>
  );
}

type ButtonType = "primary" | "secondary";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  children: React.ReactNode;
  btnType?: ButtonType;
}

export function Button({
  children,
  icon,
  btnType = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cls(
        "flex items-center text-white disabled:cursor-not-allowed disabled:bg-gray-500 focus:ring-2 font-medium rounded-lg text-sm px-3 py-2.5 focus:outline-none",
        btnType === "primary" &&
          "bg-rose-700 hover:bg-rose-800 focus:ring-rose-300",
        btnType === "secondary" &&
          "bg-gray-800 hover:bg-gray-900 focus:ring-gray-400"
      )}
      {...props}
    >
      {icon}
      <span className={icon ? "ml-1" : ""}>{children}</span>
    </button>
  );
}
