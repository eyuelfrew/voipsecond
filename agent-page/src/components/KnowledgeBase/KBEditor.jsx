import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import useStore from '../../store/store';

const KBEditor = ({ article, onClose, onSave }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('General');
    const [tags, setTags] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const { kbCategories, createKBArticle, updateKBArticle } = useStore();

    const predefinedCategories = [
        'General',
        'Technical',
        'Billing',
        'Product',
        'Troubleshooting',
        'Policy',
        'Procedures'
    ];

    const allCategories = [...new Set([...predefinedCategories, ...kbCategories])];

    useEffect(() => {
        if (article) {
            setTitle(article.title || '');
            setContent(article.content || '');
            setCategory(article.category || 'General');
            setTags(article.tags ? article.tags.join(', ') : '');
        }
    }, [article]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim() || !content.trim()) {
            alert('Title and content are required');
            return;
        }

        setIsSaving(true);

        try {
            const finalCategory = showNewCategory && newCategory.trim()
                ? newCategory.trim()
                : category;

            const articleData = {
                title: title.trim(),
                content: content.trim(),
                category: finalCategory,
                tags: tags.split(',').map(t => t.trim()).filter(t => t)
            };

            if (article) {
                await updateKBArticle(article._id, articleData);
            } else {
                await createKBArticle(articleData);
            }

            onSave();
        } catch (error) {
            console.error('Error saving article:', error);
            alert('Failed to save article');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">
                        {article ? 'Edit Article' : 'New Article'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Password Reset Procedure"
                            className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                            required
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Category
                        </label>
                        {!showNewCategory ? (
                            <div className="flex space-x-2">
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                                >
                                    {allCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setShowNewCategory(true)}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                >
                                    + New
                                </button>
                            </div>
                        ) : (
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    placeholder="Enter new category name"
                                    className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowNewCategory(false);
                                        setNewCategory('');
                                    }}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Tags (comma-separated)
                        </label>
                        <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="e.g., password, account, security"
                            className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Separate multiple tags with commas
                        </p>
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Content *
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Enter the article content here..."
                            rows={12}
                            className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none resize-none font-mono text-sm"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {content.length} characters
                        </p>
                    </div>
                </form>

                {/* Footer */}
                <div className="bg-gray-800 p-4 flex justify-end space-x-3 border-t border-gray-700">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-4 h-4" />
                        <span>{isSaving ? 'Saving...' : 'Save Article'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KBEditor;
