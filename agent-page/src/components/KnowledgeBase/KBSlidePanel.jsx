import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Star, Copy, Volume2, FileText, Edit2, Trash2 } from 'lucide-react';
import useStore from '../../store/store';
import KBEditor from './KBEditor';

const KBSlidePanel = ({ isOpen, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [showEditor, setShowEditor] = useState(false);
    const [editingArticle, setEditingArticle] = useState(null);
    const [copiedId, setCopiedId] = useState(null);

    const {
        kbArticles,
        kbCategories,
        fetchKBArticles,
        deleteKBArticle,
        toggleKBFavorite,
        incrementKBUsage
    } = useStore();

    useEffect(() => {
        if (isOpen) {
            fetchKBArticles({ search: searchQuery, category: selectedCategory });
        }
    }, [isOpen, searchQuery, selectedCategory, fetchKBArticles]);

    const handleCopy = async (article) => {
        try {
            await navigator.clipboard.writeText(article.content);
            await incrementKBUsage(article._id);
            setCopiedId(article._id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const handleReadAloud = (article) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(article.content);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            window.speechSynthesis.speak(utterance);
            incrementKBUsage(article._id);
        } else {
            alert('Text-to-speech not supported in your browser');
        }
    };

    const handleEdit = (article) => {
        setEditingArticle(article);
        setShowEditor(true);
    };

    const handleDelete = async (article) => {
        if (window.confirm(`Delete "${article.title}"?`)) {
            await deleteKBArticle(article._id);
            if (selectedArticle?._id === article._id) {
                setSelectedArticle(null);
            }
        }
    };

    const handleCreateNew = () => {
        setEditingArticle(null);
        setShowEditor(true);
    };

    const filteredArticles = kbArticles.filter(article => {
        const matchesSearch = !searchQuery ||
            article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Slide Panel */}
            <div className="fixed right-0 top-0 h-full w-[450px] bg-gray-900 shadow-2xl z-50 flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <FileText className="w-6 h-6 text-white" />
                        <h2 className="text-xl font-bold text-white">Knowledge Base</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search & Filter */}
                <div className="p-4 bg-gray-800 border-b border-gray-700 space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search articles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                    >
                        <option value="all">All Categories</option>
                        {kbCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {/* Article List or Detail View */}
                <div className="flex-1 overflow-y-auto">
                    {selectedArticle ? (
                        // Article Detail View
                        <div className="p-4">
                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="text-blue-400 hover:text-blue-300 mb-4 flex items-center space-x-1"
                            >
                                <span>←</span>
                                <span>Back to list</span>
                            </button>

                            <div className="bg-gray-800 rounded-lg p-4 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-white mb-2">{selectedArticle.title}</h3>
                                        <div className="flex items-center space-x-2 mb-3">
                                            <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                                                {selectedArticle.category}
                                            </span>
                                            {selectedArticle.isFavorite && (
                                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                                    {selectedArticle.content}
                                </div>

                                {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedArticle.tags.map((tag, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-700">
                                    <button
                                        onClick={() => handleCopy(selectedArticle)}
                                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                    >
                                        <Copy className="w-4 h-4" />
                                        <span>{copiedId === selectedArticle._id ? 'Copied!' : 'Copy'}</span>
                                    </button>

                                    <button
                                        onClick={() => handleReadAloud(selectedArticle)}
                                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                                    >
                                        <Volume2 className="w-4 h-4" />
                                        <span>Read Aloud</span>
                                    </button>

                                    <button
                                        onClick={() => handleEdit(selectedArticle)}
                                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        <span>Edit</span>
                                    </button>

                                    <button
                                        onClick={() => handleDelete(selectedArticle)}
                                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span>Delete</span>
                                    </button>
                                </div>

                                <div className="text-xs text-gray-500 pt-2">
                                    Used {selectedArticle.usageCount || 0} times
                                    {selectedArticle.lastUsed && ` • Last used ${new Date(selectedArticle.lastUsed).toLocaleDateString()}`}
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Article List
                        <div className="p-4 space-y-2">
                            {filteredArticles.length === 0 ? (
                                <div className="text-center text-gray-400 py-12">
                                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No articles found</p>
                                    <button
                                        onClick={handleCreateNew}
                                        className="mt-4 text-blue-400 hover:text-blue-300"
                                    >
                                        Create your first article
                                    </button>
                                </div>
                            ) : (
                                filteredArticles.map(article => (
                                    <div
                                        key={article._id}
                                        onClick={() => setSelectedArticle(article)}
                                        className="bg-gray-800 hover:bg-gray-750 rounded-lg p-3 cursor-pointer transition-colors border border-gray-700 hover:border-blue-500"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="font-semibold text-white flex-1">{article.title}</h4>
                                            {article.isFavorite && (
                                                <Star className="w-4 h-4 text-yellow-400 fill-current flex-shrink-0 ml-2" />
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                                            {article.content}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs px-2 py-1 bg-blue-600/30 text-blue-300 rounded">
                                                {article.category}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {article.usageCount || 0} uses
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Floating Add Button */}
                {!selectedArticle && (
                    <button
                        onClick={handleCreateNew}
                        className="absolute bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                )}
            </div>

            {/* Editor Modal */}
            {showEditor && (
                <KBEditor
                    article={editingArticle}
                    onClose={() => {
                        setShowEditor(false);
                        setEditingArticle(null);
                    }}
                    onSave={() => {
                        setShowEditor(false);
                        setEditingArticle(null);
                        fetchKBArticles({ search: searchQuery, category: selectedCategory });
                    }}
                />
            )}

            {/* Copied Toast */}
            {copiedId && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
                    ✓ Copied to clipboard!
                </div>
            )}
        </>
    );
};

export default KBSlidePanel;
