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
    <div className={"flex " + className}>
      {items.map((item, i) => (
        <button
          key={item.key}
          className={cls(
            i === 0 && "rounded-l-lg",
            i === items.length - 1 && "rounded-r-lg",
            "px-2 py-1 font-bold border-r border-gray-600",
            selectedItem === item.key
              ? type === "primary"
                ? "bg-rose-700"
                : "bg-gray-800"
              : "bg-gray-500"
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
