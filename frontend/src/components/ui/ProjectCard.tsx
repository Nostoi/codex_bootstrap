import React from 'react';

export interface ProjectCardProps {
  id: string;
  name: string;
  area?: string;
  purpose?: string;
  onClick?: () => void;
}

export default function ProjectCard({ id: _id, name, area, purpose, onClick }: ProjectCardProps) {
  return (
    <div
      className="rounded-md border-2 p-4 shadow-sm cursor-pointer transition-colors duration-300 border-secondary"
      tabIndex={0}
      role="button"
      aria-label={`Project: ${name}`}
      onClick={onClick}
      onKeyPress={e => {
        if (e.key === 'Enter' && onClick) onClick();
      }}
    >
      <div className="font-semibold text-lg text-dark mb-1">{name}</div>
      {area && <div className="text-xs text-secondary">Area: {area}</div>}
      {purpose && <div className="text-xs text-accent">Purpose: {purpose}</div>}
    </div>
  );
}
