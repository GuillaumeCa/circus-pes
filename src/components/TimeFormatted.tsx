import dayjs from "dayjs";
import { useEffect, useState } from "react";

import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

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

  useEffect(() => {
    const t = dayjs(children);
    setTime({
      ago: t.fromNow(),
      datetime: t.format(),
      label: t.format(format),
    });
  }, [children, format]);

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
