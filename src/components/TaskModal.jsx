import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../api/axiosConfig';
import { X } from 'lucide-react';

const TaskModal = ({ isOpen, onClose, task }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('pending');
    
    const queryClient = useQueryClient();

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description || '');
            setStatus(task.status);
        } else {
            setTitle('');
            setDescription('');
            setStatus('pending');
        }
    }, [task]);

    const mutation = useMutation({
        mutationFn: async (taskData) => {
            // we attach a custom property config: { encryptPayload: true } 
            // to show how AES payload encryption would work seamlessly via the interceptor.
            const config = { encryptPayload: true };
            if (task) {
                return await axiosInstance.put(`/tasks/${task._id}`, taskData, config);
            } else {
                return await axiosInstance.post('/tasks', taskData, config);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['tasks']);
            onClose();
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate({ title, description, status });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold">{task ? 'Edit Task' : 'New Task'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Task Title</label>
                        <input
                            type="text"
                            required
                            placeholder="Launch new website"
                            className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description (Optional, Encrypted in transit)</label>
                        <textarea
                            rows="4"
                            className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                            placeholder="Details about this task..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                            className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                    
                    <div className="pt-4 flex justify-end gap-3">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={mutation.isLoading}
                            className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
                        >
                            {mutation.isLoading ? 'Saving...' : 'Save Task'}
                        </button>
                    </div>
                    {mutation.isError && (
                         <div className="text-red-500 text-sm mt-2">{mutation.error?.response?.data?.message || 'Error saving task'}</div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default TaskModal;
