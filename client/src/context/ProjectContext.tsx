import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../lib/api';
import type { Project, User } from '../../../schema';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

interface ProjectContextType {
    userId: string | null;
    user: User | null;
    /** Current project ID derived from URL */
    projectId: string | null;
    projects: Project[];
    isLoading: boolean;
    error: string | null;
    refreshProjects: () => Promise<void>;
    createNewProject: (title: string) => Promise<void>;
    updateUserConfig: (config: any) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
    const { isLoaded: isAuthLoaded, isSignedIn, getToken } = useAuth();

    const [userId, setUserId] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();
    const location = useLocation();

    // Extract projectId from URL path /project/:id
    const getProjectIdFromUrl = () => {
        const match = location.pathname.match(/\/project\/([a-zA-Z0-9-]+)/);
        const id = match ? match[1] : null;
        return id === 'undefined' ? null : id;
    };

    const projectId = getProjectIdFromUrl();

    const refreshProjects = async () => {
        if (!isSignedIn) return;
        try {
            const token = await getToken();
            if (!token) return;
            const allProjects = await api.getProjects(token);
            setProjects(allProjects);
        } catch (err) {
            console.error('Failed to refresh projects:', err);
        }
    };

    const createNewProject = async (title: string) => {
        if (!isSignedIn) return;
        try {
            const token = await getToken();
            if (!token) return;
            const newProject = await api.createProject(token, title);
            if (!newProject?.id) {
                throw new Error('Failed to create project: No ID returned');
            }
            await refreshProjects();
            navigate(`/project/${newProject.id}`);
        } catch (err) {
            console.error('Failed to create project:', err);
            throw err;
        }
    };

    const updateUserConfig = async (config: any) => {
        if (!isSignedIn) return;
        try {
            const token = await getToken();
            if (!token) return;
            await api.updateUserConfig(token, config);
            // Refresh user
            const updatedUser = await api.getUser(token, 'me');
            setUser(updatedUser);
        } catch (err) {
            console.error('Failed to update user config:', err);
            throw err;
        }
    };

    useEffect(() => {
        const bootstrap = async () => {
            if (!isAuthLoaded) return;
            if (!isSignedIn) {
                setIsLoading(false);
                return;
            }

            try {
                const token = await getToken();
                if (!token) {
                    setIsLoading(false);
                    return;
                }

                // 1. Sync User (Get or Create)
                const userResponse = await api.syncUser(token);
                setUserId(userResponse.id);
                setUser(userResponse);

                // 2. Load Projects
                const allProjects = await api.getProjects(token);
                setProjects(allProjects);

            } catch (err: unknown) {
                console.error('Bootstrap failed:', err);
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('An unknown error occurred');
                }
            } finally {
                setIsLoading(false);
            }
        };

        bootstrap();
    }, [isAuthLoaded, isSignedIn, getToken]);

    return (
        <ProjectContext.Provider value={{
            userId,
            projectId,
            projects,
            isLoading,
            error,
            refreshProjects,
            createNewProject,
            updateUserConfig,
            user
        }}>
            {children}
        </ProjectContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProject() {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
}
