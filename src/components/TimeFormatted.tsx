import dayjs from "dayjs";
import { useEffect, useState } from "react";

export function TimeFormatted({
  children,
  format = "DD/MM/YYYY",
}: {
  children: Date;
  format: string;
}) {
  const [time, setTime] = useState("");

  useEffect(() => {
    setTime(dayjs(children).format(format));
  }, []);

  return <time dateTime={time}>{time}</time>;
}
