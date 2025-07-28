'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  description: string
  status: 'active' | 'completed' | 'on-hold'
  dueDate: string
  tasks: number
  completedTasks: number
}

export default function ProjectsPage() {
  const [projects] = useState<Project[]>([
    {
      id: '1',
      name: 'Website Redesign',
      description: 'Complete overhaul of the company website with modern design',
      status: 'active',
      dueDate: '2025-08-15',
      tasks: 12,
      completedTasks: 8
    },
    {
      id: '2',
      name: 'Mobile App Development',
      description: 'Native mobile application for iOS and Android',
      status: 'active',
      dueDate: '2025-09-30',
      tasks: 25,
      completedTasks: 5
    },
    {
      id: '3',
      name: 'Database Migration',
      description: 'Migrate legacy database to PostgreSQL',
      status: 'completed',
      dueDate: '2025-07-01',
      tasks: 8,
      completedTasks: 8
    }
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'badge-success'
      case 'completed': return 'badge-info'
      case 'on-hold': return 'badge-warning'
      default: return 'badge-neutral'
    }
  }

  const getProgressPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }

  return (
    <main className="min-h-screen bg-base-100">
      {/* Navigation */}
      <div className="navbar bg-primary text-primary-content">
        <div className="flex-1">
          <Link href="/" className="btn btn-ghost text-xl">
            Codex Bootstrap
          </Link>
        </div>
        <div className="flex-none">
          <ul className="menu menu-horizontal px-1">
            <li><Link href="/dashboard">Dashboard</Link></li>
            <li><Link href="/projects" className="text-accent">Projects</Link></li>
            <li><Link href="/reflection">Reflection</Link></li>
            <li><Link href="/settings">Settings</Link></li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Projects</h1>
          <button className="btn btn-primary">
            + New Project
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id} className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="card-title text-lg">{project.name}</h2>
                  <div className={`badge ${getStatusColor(project.status)}`}>
                    {project.status}
                  </div>
                </div>
                
                <p className="text-sm text-base-content/70 mb-4">
                  {project.description}
                </p>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{getProgressPercentage(project.completedTasks, project.tasks)}%</span>
                    </div>
                    <progress 
                      className="progress progress-primary w-full" 
                      value={project.completedTasks} 
                      max={project.tasks}
                    ></progress>
                    <div className="text-xs text-base-content/60 mt-1">
                      {project.completedTasks} of {project.tasks} tasks completed
                    </div>
                  </div>

                  <div className="text-sm">
                    <span className="font-medium">Due Date: </span>
                    <span className="text-base-content/70">
                      {new Date(project.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="card-actions justify-end mt-4">
                  <button className="btn btn-sm btn-outline">View Details</button>
                  <button className="btn btn-sm btn-primary">Edit</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
