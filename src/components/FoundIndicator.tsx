import { cls } from "./cls";

export function FoundIndicator({ value }: { value: number }) {
  return (
    <div
      title="Indique la présence de cette création sur ce shard"
      className="ml-3 flex bg-gray-700 rounded-md p-1 items-center"
    >
      <span className="text-sm hidden md:inline uppercase font-bold text-gray-200 ml-1 mr-2">
        Fiabilité
      </span>
      <div className="flex space-x-1" key={value}>
        {Array(3)
          .fill("")
          .map((_, i) => {
            const isActive = i <= value;
            return (
              <div
                key={i}
                className={cls(
                  "h-5 w-3 rounded-sm",
                  !isActive && "bg-gray-600",
                  isActive && "animate-pulse",
                  isActive && value === 0 && "bg-red-500",
                  isActive && value === 1 && "bg-orange-500",
                  isActive && value === 2 && "bg-green-500"
                )}
              ></div>
            );
          })}
      </div>
    </div>
  );
}
