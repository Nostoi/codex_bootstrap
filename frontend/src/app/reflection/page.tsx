'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ReflectionEntry {
  id: string;
  date: string;
  category: 'daily' | 'weekly' | 'monthly';
  title: string;
  content: string;
  mood: 1 | 2 | 3 | 4 | 5;
  tags: string[];
}

export default function ReflectionPage() {
  const [activeTab, setActiveTab] = useState<'view' | 'create'>('view');
  const [newEntry, setNewEntry] = useState<{
    title: string;
    content: string;
    category: 'daily' | 'weekly' | 'monthly';
    mood: 1 | 2 | 3 | 4 | 5;
    tags: string;
  }>({
    title: '',
    content: '',
    category: 'daily',
    mood: 3,
    tags: '',
  });

  const [reflections] = useState<ReflectionEntry[]>([
    {
      id: '1',
      date: '2025-07-27',
      category: 'daily',
      title: 'Great progress on frontend',
      content:
        'Today I made significant progress on the frontend components. The Docker setup is working perfectly and all tests are passing. I feel confident about the direction we&apos;re taking.',
      mood: 5,
      tags: ['development', 'docker', 'frontend'],
    },
    {
      id: '2',
      date: '2025-07-26',
      category: 'daily',
      title: 'Challenges with ESLint',
      content:
        'Spent most of the day fixing ESLint issues. It was frustrating but ultimately rewarding to have clean, compliant code.',
      mood: 3,
      tags: ['eslint', 'code-quality', 'debugging'],
    },
    {
      id: '3',
      date: '2025-07-21',
      category: 'weekly',
      title: 'Week 30 Review',
      content:
        'This week was focused on improving code quality and setting up proper development workflows. The investment in tooling is paying off.',
      mood: 4,
      tags: ['weekly-review', 'productivity', 'workflow'],
    },
  ]);

  const getMoodEmoji = (mood: number) => {
    switch (mood) {
      case 1:
        return '😢';
      case 2:
        return '😕';
      case 3:
        return '😐';
      case 4:
        return '😊';
      case 5:
        return '😄';
      default:
        return '😐';
    }
  };

  const handleCreateEntry = () => {
    // In a real app, this would save to the backend
    console.log('Creating new reflection entry:', newEntry);
    setNewEntry({
      title: '',
      content: '',
      category: 'daily',
      mood: 3,
      tags: '',
    });
    setActiveTab('view');
  };

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
            <li>
              <Link href="/dashboard">Dashboard</Link>
            </li>
            <li>
              <Link href="/projects">Projects</Link>
            </li>
            <li>
              <Link href="/reflection" className="text-accent">
                Reflection
              </Link>
            </li>
            <li>
              <Link href="/settings">Settings</Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Reflection Journal</h1>

        {/* Tabs */}
        <div className="tabs tabs-boxed mb-6">
          <button
            className={`tab ${activeTab === 'view' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('view')}
          >
            View Entries
          </button>
          <button
            className={`tab ${activeTab === 'create' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            New Entry
          </button>
        </div>

        {/* View Entries Tab */}
        {activeTab === 'view' && (
          <div className="space-y-6">
            {reflections.map(entry => (
              <div key={entry.id} className="card bg-base-200 shadow-lg">
                <div className="card-body">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h2 className="card-title">{entry.title}</h2>
                      <div className="flex items-center gap-2 text-sm text-base-content/70">
                        <span>{new Date(entry.date).toLocaleDateString()}</span>
                        <div className="badge badge-outline">{entry.category}</div>
                        <span className="text-lg">{getMoodEmoji(entry.mood)}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-base-content/80 mb-4">{entry.content}</p>

                  <div className="flex flex-wrap gap-2">
                    {entry.tags.map(tag => (
                      <div key={tag} className="badge badge-primary badge-sm">
                        #{tag}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Entry Tab */}
        {activeTab === 'create' && (
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <h2 className="card-title mb-4">New Reflection Entry</h2>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Title</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter a title for your reflection"
                  className="input input-bordered"
                  value={newEntry.title}
                  onChange={e => setNewEntry({ ...newEntry, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Category</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={newEntry.category}
                    onChange={e =>
                      setNewEntry({
                        ...newEntry,
                        category: e.target.value as 'daily' | 'weekly' | 'monthly',
                      })
                    }
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Mood (1-5)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      className="range range-primary"
                      value={newEntry.mood}
                      onChange={e =>
                        setNewEntry({
                          ...newEntry,
                          mood: parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5,
                        })
                      }
                    />
                    <span className="text-2xl">{getMoodEmoji(newEntry.mood)}</span>
                  </div>
                </div>
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Content</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-32"
                  placeholder="Write your reflection here..."
                  value={newEntry.content}
                  onChange={e => setNewEntry({ ...newEntry, content: e.target.value })}
                ></textarea>
              </div>

              <div className="form-control mb-6">
                <label className="label">
                  <span className="label-text">Tags (comma-separated)</span>
                </label>
                <input
                  type="text"
                  placeholder="productivity, learning, challenges"
                  className="input input-bordered"
                  value={newEntry.tags}
                  onChange={e => setNewEntry({ ...newEntry, tags: e.target.value })}
                />
              </div>

              <div className="card-actions justify-end">
                <button className="btn btn-outline" onClick={() => setActiveTab('view')}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCreateEntry}
                  disabled={!newEntry.title || !newEntry.content}
                >
                  Save Entry
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
