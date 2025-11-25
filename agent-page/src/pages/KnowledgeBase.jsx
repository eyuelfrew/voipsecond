import { useState, useEffect } from 'react';
import {
  BookOpen, Plus, Search, Edit, Trash2, Copy, Star, Eye,
  Download, Tag, Clock, X, Save, FileText, Grid, List
} from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../config';

const baseUrl = getApiUrl();

const KnowledgeBase = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'popular', 'alphabetical'

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    tags: '',
    newCategory: ''
  });

  const categories = [
    'General',
    'Technical',
    'Billing',
    'Product',
    'Troubleshooting',
    'Policy',
    'Procedures',
    'FAQ'
  ];

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseUrl}/kb`, {
        withCredentials: true
      });
      setArticles(response.data.articles || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const articleData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.newCategory.trim() || formData.category,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
      };

      if (editingArticle) {
        await axios.put(`${baseUrl}/kb/${editingArticle._id}`, articleData, {
          withCredentials: true
        });
      } else {
        await axios.post(`${baseUrl}/kb`, articleData, {
          withCredentials: true
        });
      }

      setFormData({
        title: '',
        content: '',
        category: 'General',
        tags: '',
        newCategory: ''
      });
      setShowEditor(false);
      setEditingArticle(null);
      fetchArticles();
    } catch (error) {
      console.error('Error saving article:', error);
      alert(error.response?.data?.message || 'Failed to save article');
    }
  };

  const handleEdit = (article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      category: article.category,
      tags: article.tags ? article.tags.join(', ') : '',
      newCategory: ''
    });
    setShowEditor(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this article?')) {
      return;
    }

    try {
      await axios.delete(`${baseUrl}/kb/${id}`, {
        withCredentials: true
      });
      fetchArticles();
      if (selectedArticle?._id === id) {
        setSelectedArticle(null);
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      alert(error.response?.data?.message || 'Failed to delete article');
    }
  };

  const handleCopy = async (article) => {
    try {
      await navigator.clipboard.writeText(article.content);
      setCopiedId(article._id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleToggleFavorite = async (articleId) => {
    try {
      await axios.patch(`${baseUrl}/kb/${articleId}/favorite`, {}, {
        withCredentials: true
      });
      fetchArticles();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Title', 'Category', 'Content', 'Tags', 'Usage Count'],
      ...filteredArticles.map(article => [
        article.title,
        article.category,
        article.content.replace(/\n/g, ' '),
        article.tags ? article.tags.join('; ') : '',
        article.usageCount || 0
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'knowledge-base.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredArticles = articles
    .filter(article => {
      const matchesSearch = !searchQuery ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (article.tags && article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
      const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'popular') {
        return (b.usageCount || 0) - (a.usageCount || 0);
      } else {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });

  const uniqueCategories = ['all', ...new Set(articles.map(a => a.category))];

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <BookOpen className="w-8 h-8 text-yellow-500" />
              <span>Knowledge Base</span>
            </h1>
            <p className="text-gray-500 mt-1">Manage your knowledge articles and resources</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleExport}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-all flex items-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Export</span>
            </button>
            <button
              onClick={() => {
                setEditingArticle(null);
                setFormData({
                  title: '',
                  content: '',
                  category: 'General',
                  tags: '',
                  newCategory: ''
                });
                setShowEditor(true);
              }}
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>New Article</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Article Detail (when selected) */}
        {selectedArticle && (
          <div className="w-[500px] flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
            {/* Detail Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-yellow-400 to-yellow-500 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 pr-4">
                  <h2 className="text-2xl font-bold text-black mb-2 break-words">{selectedArticle.title}</h2>
                  <div className="flex items-center space-x-2 flex-wrap">
                    <span className="px-3 py-1 bg-black text-yellow-400 rounded-full text-sm font-medium">
                      {selectedArticle.category}
                    </span>
                    {selectedArticle.isFavorite && (
                      <Star className="w-5 h-5 fill-black text-black" />
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="p-2 hover:bg-black hover:bg-opacity-10 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5 text-black" />
                </button>
              </div>

              <div className="flex items-center space-x-4 text-black text-sm flex-wrap gap-2">
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{selectedArticle.usageCount || 0} views</span>
                </div>
                {selectedArticle.createdAt && (
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(selectedArticle.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose max-w-none">
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed break-words">
                  {selectedArticle.content}
                </div>
              </div>

              {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <Tag className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.tags.map((tag, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full break-words">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex-shrink-0 p-6 bg-gray-50 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleCopy(selectedArticle)}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copiedId === selectedArticle._id ? 'Copied!' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => handleToggleFavorite(selectedArticle._id)}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg transition-colors"
                >
                  <Star className={`w-4 h-4 ${selectedArticle.isFavorite ? 'fill-current' : ''}`} />
                  <span>{selectedArticle.isFavorite ? 'Unfavorite' : 'Favorite'}</span>
                </button>
                <button
                  onClick={() => handleEdit(selectedArticle)}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(selectedArticle._id)}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Center/Right - Article List */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white transition-all">
          {/* Search & Filters */}
          <div className="flex-shrink-0 p-6 border-b border-gray-200 space-y-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles by title, content, or tags..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-gray-900"
                />
              </div>
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-gray-900"
              >
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-gray-900"
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="alphabetical">Alphabetical</option>
              </select>

              <div className="text-sm text-gray-600">
                {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Articles Grid/List */}
          <div className="flex-1 overflow-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent"></div>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <BookOpen className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">No articles found</p>
                <p className="text-sm">Create your first knowledge base article</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((article) => (
                  <div
                    key={article._id}
                    className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => setSelectedArticle(article)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 pr-2">
                        <h3 className="font-semibold text-gray-900 group-hover:text-yellow-600 transition-colors line-clamp-2 break-words">
                          {article.title}
                        </h3>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(article._id);
                        }}
                        className="flex-shrink-0 ml-2"
                      >
                        <Star
                          className={`w-5 h-5 ${article.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      </button>
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-3 mb-4 break-words">
                      {article.content}
                    </p>

                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium break-words">
                        {article.category}
                      </span>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Eye className="w-3 h-3" />
                        <span>{article.usageCount || 0}</span>
                      </div>
                    </div>

                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {article.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded break-words">
                            #{tag}
                          </span>
                        ))}
                        {article.tags.length > 3 && (
                          <span className="px-2 py-0.5 text-gray-500 text-xs">
                            +{article.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredArticles.map((article) => (
                  <div
                    key={article._id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer flex items-center space-x-4"
                    onClick={() => setSelectedArticle(article)}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-black" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate break-words">{article.title}</h3>
                        {article.isFavorite && (
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-1 break-words">{article.content}</p>
                    </div>
                    <div className="flex items-center space-x-4 flex-shrink-0">
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium break-words">
                        {article.category}
                      </span>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Eye className="w-4 h-4" />
                        <span>{article.usageCount || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>


      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-yellow-400 to-yellow-500 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-black">
                {editingArticle ? 'Edit Article' : 'New Article'}
              </h2>
              <button
                onClick={() => {
                  setShowEditor(false);
                  setEditingArticle(null);
                }}
                className="p-2 hover:bg-black hover:bg-opacity-10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-black" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-gray-900"
                  placeholder="e.g., How to Reset Password"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-gray-900"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or New Category
                  </label>
                  <input
                    type="text"
                    name="newCategory"
                    value={formData.newCategory}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-gray-900"
                    placeholder="Custom category"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-gray-900"
                  placeholder="e.g., password, account, security"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  rows={15}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-gray-900 font-mono text-sm resize-none"
                  placeholder="Enter the article content here..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  {formData.content.length} characters
                </p>
              </div>
            </form>

            {/* Footer */}
            <div className="flex-shrink-0 bg-gray-50 p-6 flex justify-end space-x-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowEditor(false);
                  setEditingArticle(null);
                }}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black rounded-lg transition-all font-semibold flex items-center space-x-2 shadow-md hover:shadow-lg"
              >
                <Save className="w-5 h-5" />
                <span>Save Article</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
