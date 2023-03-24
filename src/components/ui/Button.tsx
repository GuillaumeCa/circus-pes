import Link from "next/link";
import React from "react";
import { cls } from "../../utils/cls";

export function UserButton({ children, ...props }: ButtonProps) {
  return (
    <Button
      icon={
        <svg
          viewBox="0 -28.5 256 256"
          strokeWidth={1.5}
          fill="currentColor"
          className="w-6 h-6"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z"
            fillRule="nonzero"
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

export function LinkButton({
  children,
  btnType = "primary",
  href,
}: LinkButtonProps) {
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

const Button = React.forwardRef<any, ButtonProps>(
  ({ children, icon, className = "", btnType = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cls(
          "flex items-center text-white disabled:cursor-not-allowed disabled:bg-gray-500 focus:ring-2 font-medium rounded-lg text-sm px-3 py-2.5 focus:outline-none",
          btnType === "primary" &&
            "bg-rose-700 hover:bg-rose-800 focus:ring-rose-300",
          btnType === "secondary" &&
            "bg-gray-800 hover:bg-gray-900 focus:ring-gray-400",
          className
        )}
        {...props}
      >
        {icon}
        <span className={icon ? "ml-1" : ""}>{children}</span>
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
