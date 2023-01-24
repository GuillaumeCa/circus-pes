import React from "react";
import { cls } from "./cls";

type TabBarItem<T> = {
  icon?: React.ReactNode;
  label: string;
  key: T;
};

export function TabBar<T extends React.Key>({
  selectedItem,
  items,
  className = "",
  type = "primary",
  onSelect,
}: {
  className?: string;
  type?: "primary" | "secondary";
  selectedItem: T;
  items: TabBarItem<T>[];
  onSelect(item: T): void;
}) {
  return (
    <div className={"flex items-center " + className}>
      {items.map((item, i) => (
        <button
          key={item.key}
          className={cls(
            i === 0 && "rounded-l-lg",
            i < items.length - 1 && "border-r",
            i === items.length - 1 && "rounded-r-lg",
            "px-2 py-1 flex items-center font-semibold focus:z-10 border-gray-700 outline-offset-1",
            selectedItem === item.key
              ? type === "primary"
                ? "bg-rose-700 outline-rose-500"
                : "bg-gray-800 outline-gray-700"
              : "bg-gray-500 outline-gray-400"
          )}
          onClick={() => onSelect(item.key)}
        >
          {item.icon}
          <span className={item.icon ? "ml-1" : ""}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
