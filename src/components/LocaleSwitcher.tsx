import cookie from "cookiejs";
import Link from "next/link";
import { useRouter } from "next/router";
import { cls } from "../utils/cls";

export function LocaleSwitcher() {
  const { pathname, locale, asPath } = useRouter();

  return (
    <>
      <Link
        href={pathname}
        as={asPath}
        locale="fr"
        className={cls(
          "hover:text-gray-300",
          locale === "fr" ? "text-gray-300" : "text-gray-400"
        )}
        onClick={() => {
          cookie("NEXT_LOCALE", "fr");
        }}
      >
        FR
      </Link>
      <Link
        href={pathname}
        as={asPath}
        locale="en"
        className={cls(
          "hover:text-gray-300",
          locale === "en" ? "text-gray-300" : "text-gray-400"
        )}
        onClick={() => {
          cookie("NEXT_LOCALE", "en");
        }}
      >
        EN
      </Link>
    </>
  );
}
