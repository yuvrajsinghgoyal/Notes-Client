import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import TaskModal from '../components/TaskModal';
import { format } from 'date-fns';
import { LogOut, Plus, Search, Trash2, Edit } from 'lucide-react';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const queryClient = useQueryClient();
    
    // State
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState(null);

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Fetch Tasks
    const { data, isLoading } = useQuery({
        queryKey: ['tasks', page, debouncedSearch, statusFilter],
        queryFn: async () => {
            const res = await axiosInstance.get('/tasks', {
                params: {
                    page,
                    limit: 5,
                    search: debouncedSearch,
                    status: statusFilter,
                }
            });
            return res.data;
        },
        keepPreviousData: true,
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            await axiosInstance.delete(`/tasks/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['tasks']);
        }
    });

    const handleLogout = async () => {
        try {
            await axiosInstance.post('/users/logout');
            logout();
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    const openCreateModal = () => {
        setTaskToEdit(null);
        setIsModalOpen(true);
    };

    const openEditModal = (task) => {
        setTaskToEdit(task);
        setIsModalOpen(true);
    };

    const statusColors = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'in-progress': 'bg-blue-100 text-blue-800',
        'completed': 'bg-green-100 text-green-800'
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex-shrink-0 flex items-center">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-indigo-600 bg-clip-text text-transparent">TaskMaster</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-gray-700 font-medium">Hi, {user?.name}</span>
                            <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 transition">
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Header & Controls */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input 
                                type="text"
                                placeholder="Search tasks..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                        <select 
                            className="border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                    <button 
                        onClick={openCreateModal}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition w-full md:w-auto justify-center"
                    >
                        <Plus className="w-4 h-4" /> New Task
                    </button>
                </div>

                {/* Task List */}
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">Loading tasks...</div>
                    ) : !data?.tasks?.length ? (
                        <div className="p-12 text-center text-gray-500">No tasks found. Create one!</div>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {data.tasks.map(task => (
                                <li key={task._id} className="p-6 hover:bg-gray-50 transition">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
                                                    {task.status.replace('-', ' ').toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-gray-600 line-clamp-2">{task.description}</p>
                                            <div className="mt-2 text-sm text-gray-400">
                                                Created on {format(new Date(task.createdAt), 'MMM dd, yyyy')}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 ml-4">
                                            <button 
                                                onClick={() => openEditModal(task)}
                                                className="p-2 text-gray-400 hover:text-blue-500 transition rounded-full hover:bg-blue-50"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => deleteMutation.mutate(task._id)}
                                                className="p-2 text-gray-400 hover:text-red-500 transition rounded-full hover:bg-red-50"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Pagination */}
                {data?.pages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-8">
                        <button 
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50"
                        >
                            Previous
                        </button>
                        <span className="text-gray-600">Page {page} of {data.pages}</span>
                        <button 
                            disabled={page === data.pages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </main>

            {isModalOpen && (
                <TaskModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    task={taskToEdit} 
                />
            )}
        </div>
    );
};

export default Dashboard;
