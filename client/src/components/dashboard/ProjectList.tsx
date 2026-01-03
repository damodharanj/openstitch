import { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { Plus, Folder, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';

export function ProjectList() {
    const { projects, createNewProject, isLoading } = useProject();
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectTitle, setNewProjectTitle] = useState('');

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectTitle.trim()) return;

        await createNewProject(newProjectTitle);
        setNewProjectTitle('');
        setIsCreating(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="animate-pulse text-slate-400">Loading projects...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
                        <p className="text-slate-500 mt-1">Manage your design projects</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <UserButton showName appearance={{ elements: { userButtonOuterIdentifier: "text-slate-700 font-medium" } }} />
                        <button
                            onClick={() => setIsCreating(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                        >
                            <Plus className="w-5 h-5" />
                            New Project
                        </button>
                    </div>
                </div>

                {isCreating && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                            <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
                            <form onSubmit={handleCreate}>
                                <input
                                    type="text"
                                    placeholder="Project Title"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={newProjectTitle}
                                    onChange={(e) => setNewProjectTitle(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreating(false)}
                                        className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                                    >
                                        Create Project
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <Link
                            key={project.id}
                            to={`/project/${project.id}`}
                            className="group bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-indigo-200 transition cursor-pointer block"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition">
                                    <Folder className="w-6 h-6 text-indigo-600" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-indigo-600 transition">
                                {project.title}
                            </h3>
                            <div className="flex items-center text-sm text-slate-500 mt-4">
                                <Calendar className="w-4 h-4 mr-2" />
                                {new Date(project.createdAt || Date.now()).toLocaleDateString()}
                            </div>
                        </Link>
                    ))}

                    {projects.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                            No projects yet. Create your first one!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
