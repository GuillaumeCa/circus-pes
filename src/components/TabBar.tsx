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
            i === items.length - 1 && "rounded-r-lg",
            "px-2 py-1 border-r font-semibold border-gray-600 outline-none focus:ring-2 ",
            selectedItem === item.key
              ? type === "primary"
                ? "bg-rose-700 focus:ring-rose-500"
                : "bg-gray-800 focus:ring-gray-700"
              : "bg-gray-500 focus:ring-gray-400"
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
