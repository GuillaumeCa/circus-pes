import dayjs from "dayjs";
import { useEffect, useState } from "react";

import relativeTime from "dayjs/plugin/relativeTime";
import updateLocale from "dayjs/plugin/updateLocale";
import { useRouter } from "next/router";

dayjs.extend(relativeTime);
dayjs.extend(updateLocale);

dayjs.updateLocale("fr", {
  relativeTime: {
    future: "dans %s",
    past: "il y a %s",
    s: "1 min",
    m: "1 min",
    mm: "%d min",
    h: "1h",
    hh: "%dh",
    d: "1j",
    dd: "%dj",
    M: "1 mois",
    MM: "%d mois",
    y: "1 an",
    yy: "%d ans",
  },
});

export function TimeFormatted({
  children,
  format = "DD/MM/YYYY HH:mm",
  className = "",
}: {
  children: Date;
  className?: string;
  format?: string;
}) {
  const [time, setTime] = useState({
    ago: "",
    datetime: "",
    label: "",
  });
  const [showDateTime, setShowDateTime] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const t = dayjs(children);
    setTime({
      ago: t.fromNow(),
      datetime: t.format(),
      label: t.format(format),
    });
  }, [children, format, router.locale]);

  return (
    <time
      title={time.label}
      dateTime={time.datetime}
      onClick={() => setShowDateTime(!showDateTime)}
      className={"cursor-pointer " + className}
    >
      {showDateTime ? time.label : time.ago}
    </time>
  );
}
