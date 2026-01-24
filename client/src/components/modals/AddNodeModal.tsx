import { useState } from 'react';
import { Database, Image, X } from 'lucide-react';

interface AddNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddDataSource: (config: any) => void;
    onAddImage: (file: File) => void;
}

export function AddNodeModal({ isOpen, onClose, onAddDataSource, onAddImage }: AddNodeModalProps) {
    const [activeTab, setActiveTab] = useState<'data_source' | 'image'>('data_source');
    const [dataSourceConfig, setDataSourceConfig] = useState({
        type: 'querybook',
        url: '',
        queryId: '',
        environmentId: '',
        apiKey: '',
    });
    const [selectedImage, setSelectedImage] = useState<File | null>(null);

    if (!isOpen) return null;

    const handleAddDataSource = () => {
        onAddDataSource(dataSourceConfig);
        setDataSourceConfig({
            type: 'querybook',
            url: '',
            queryId: '',
            environmentId: '',
            apiKey: '',
        });
        onClose();
    };

    const handleAddImage = () => {
        if (selectedImage) {
            onAddImage(selectedImage);
            setSelectedImage(null);
            onClose();
        }
    };

    const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedImage(file);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900">Add New Node</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 rounded-md transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('data_source')}
                        className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 font-medium transition-colors ${
                            activeTab === 'data_source'
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        <Database size={18} />
                        Data Source
                    </button>
                    <button
                        onClick={() => setActiveTab('image')}
                        className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 font-medium transition-colors ${
                            activeTab === 'image'
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        <Image size={18} />
                        Image
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'data_source' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Data Source Type
                                </label>
                                <select
                                    value={dataSourceConfig.type}
                                    onChange={(e) => setDataSourceConfig({ ...dataSourceConfig, type: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="querybook">QueryBook</option>
                                    <option value="api">API</option>
                                </select>
                            </div>

                            {dataSourceConfig.type === 'querybook' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            QueryBook URL
                                        </label>
                                        <input
                                            type="url"
                                            value={dataSourceConfig.url}
                                            onChange={(e) => setDataSourceConfig({ ...dataSourceConfig, url: e.target.value })}
                                            placeholder="https://your-querybook-instance.com"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Environment ID
                                        </label>
                                        <input
                                            type="text"
                                            value={dataSourceConfig.environmentId}
                                            onChange={(e) => setDataSourceConfig({ ...dataSourceConfig, environmentId: e.target.value })}
                                            placeholder="prod"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Query ID
                                        </label>
                                        <input
                                            type="text"
                                            value={dataSourceConfig.queryId}
                                            onChange={(e) => setDataSourceConfig({ ...dataSourceConfig, queryId: e.target.value })}
                                            placeholder="12345"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </>
                            )}

                            {dataSourceConfig.type === 'api' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            API URL
                                        </label>
                                        <input
                                            type="url"
                                            value={dataSourceConfig.url}
                                            onChange={(e) => setDataSourceConfig({ ...dataSourceConfig, url: e.target.value })}
                                            placeholder="https://api.example.com/data"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            API Key (optional)
                                        </label>
                                        <input
                                            type="password"
                                            value={dataSourceConfig.apiKey}
                                            onChange={(e) => setDataSourceConfig({ ...dataSourceConfig, apiKey: e.target.value })}
                                            placeholder="Your API key"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={handleAddDataSource}
                                    disabled={!dataSourceConfig.url}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                                >
                                    Add Data Source
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'image' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Select Image File
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageFileChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {selectedImage && (
                                <div className="space-y-2">
                                    <p className="text-sm text-slate-600">
                                        Selected: <span className="font-medium">{selectedImage.name}</span>
                                    </p>
                                    <div className="w-full h-48 border-2 border-slate-200 rounded-lg overflow-hidden">
                                        <img
                                            src={URL.createObjectURL(selectedImage)}
                                            alt="Preview"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={handleAddImage}
                                    disabled={!selectedImage}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                                >
                                    Add Image Node
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}