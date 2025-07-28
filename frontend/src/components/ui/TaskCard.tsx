import React from "react";

export interface TaskCardProps {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "done";
  dueDate?: string;
  onClick?: () => void;
}

const statusColors = {
  todo: "border-warning",
  "in-progress": "border-info",
  done: "border-success",
};

export default function TaskCard({ id: _id, title, status, dueDate, onClick }: TaskCardProps) {
  return (
    <div
      className={`rounded-md border-2 p-4 shadow-sm cursor-pointer transition-colors duration-300 ${statusColors[status]}`}
      tabIndex={0}
      role="button"
      aria-label={`Task: ${title}, status: ${status}`}
      onClick={onClick}
      onKeyPress={(e) => {
        if (e.key === "Enter" && onClick) onClick();
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-lg text-dark">{title}</span>
        <span className={`px-2 py-1 rounded text-xs font-bold ${statusColors[status]}`}>{status}</span>
      </div>
      {dueDate && (
        <div className="text-xs text-secondary">Due: {dueDate}</div>
      )}
    </div>
  );
}
