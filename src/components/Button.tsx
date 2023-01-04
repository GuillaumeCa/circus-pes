import Link from "next/link";
import { cls } from "./cls";

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
