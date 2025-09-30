import { useState, useEffect } from 'react'
import { FiTrash, FiEdit2, FiPlus, FiMessageSquare } from 'react-icons/fi'
import axios from 'axios'
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import type { IVROption } from '../components/types'

type IVRMenu = {
  _id: string
  name: string
  greeting: string
  description: string
  options: IVROption[]
  createdAt: string
}

export default function IVRMenus() {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const { isDarkMode } = useTheme();
  const [menus, setMenus] = useState<IVRMenu[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate();

  useEffect(() => {
    fetchMenus()
  }, [])

  const fetchMenus = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API}/api/ivr/menu`)
      setMenus(response.data)
    } catch (err) {
      setError('Failed to fetch IVR menus')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const deleteMenu = async (id: string) => {
    console.log(id);
    if (!window.confirm('Are you sure you want to delete this menu?')) return
    try {
      await axios.delete(`${API}/api/ivr/menu/${id}`)
      setMenus(menus.filter(menu => menu._id !== id))
    } catch (err) {
      setError('Failed to delete menu')
      console.error(err)
    }
  }

  // const handleEdit = (id: string) => {
  //   // Add edit logic here
  // }


  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="cc-text-secondary font-medium">Loading IVR menus...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full cc-bg-background cc-transition relative"
         style={{ 
           background: isDarkMode 
             ? 'linear-gradient(135deg, #000000 0%, #1F2937 25%, #111827 50%, #1F2937 75%, #000000 100%)'
             : 'linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 25%, #F3F4F6 50%, #F9FAFB 75%, #FFFFFF 100%)'
         }}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Yellow Orbs */}
        <div className="absolute top-20 right-20 w-24 h-24 bg-yellow-400 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute bottom-32 left-20 w-32 h-32 bg-yellow-300 rounded-full opacity-5 animate-bounce"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,0,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

        {/* Animated Lines */}
        <div className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-transparent via-yellow-400/20 to-transparent animate-pulse"></div>
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-yellow-300/10 to-transparent animate-pulse"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold cc-text-primary flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center shadow-md">
            <FiMessageSquare className="h-5 w-5 text-black" />
          </div>
          IVR Menus
        </h1>
        <button
          onClick={() => navigate('/ivr-menu/create')}
          className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-4 py-2 rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200 shadow-md hover:shadow-lg font-medium flex items-center gap-2"
        >
          Add IVR Menu
        </button>
      </div>

      {/* Table */}
      <div className="cc-glass rounded-xl shadow-lg cc-border border overflow-hidden">
        {menus.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FiMessageSquare className="h-10 w-10 cc-text-accent" />
            </div>
            <h3 className="text-xl font-bold cc-text-primary mb-2">No IVR Menus Yet</h3>
            <p className="cc-text-secondary text-sm mb-6 max-w-md mx-auto">Get started by creating your first interactive voice response menu to route calls efficiently</p>
            <button
              onClick={() => navigate('/ivr-menu/create')}
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-6 py-3 rounded-xl hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold inline-flex items-center gap-2"
            >
              <FiPlus className="h-5 w-5" />
              Create First Menu
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y cc-border">
              <thead className="cc-bg-surface/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold cc-text-primary uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold cc-text-primary uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold cc-text-primary uppercase tracking-wider">
                    Entries
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold cc-text-primary uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold cc-text-primary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y cc-border">
                {menus.map((menu) => (
                  <tr key={menu._id} className="hover:bg-yellow-400/5 transition-all duration-200 group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 rounded-xl flex items-center justify-center group-hover:from-yellow-400/30 group-hover:to-yellow-500/30 transition-all duration-200 shadow-sm">
                          <FiMessageSquare className="h-5 w-5 cc-text-accent" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold cc-text-primary">{menu.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm cc-text-secondary max-w-xs truncate">
                        {menu.description || <span className="italic opacity-50">No description</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-lg bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 cc-text-accent border border-yellow-400/30">
                        {menu.options?.length || 0} options
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm cc-text-secondary font-medium">
                      {new Date(menu.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/ivr-menu/edit/${menu._id}`)}
                          className="inline-flex items-center gap-1.5 bg-gradient-to-r from-yellow-400/10 to-yellow-500/10 cc-text-accent px-4 py-2 rounded-lg hover:from-yellow-400/20 hover:to-yellow-500/20 transition-all duration-200 font-semibold border border-yellow-400/30 hover:border-yellow-400/50 shadow-sm hover:shadow-md"
                        >
                          <FiEdit2 className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => deleteMenu(menu._id)}
                          className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-600 px-4 py-2 rounded-lg hover:bg-red-500/20 transition-all duration-200 font-semibold border border-red-500/30 hover:border-red-500/50 shadow-sm hover:shadow-md"
                        >
                          <FiTrash className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}