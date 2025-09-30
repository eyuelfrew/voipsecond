import { useState, useEffect } from 'react'
import { FiTrash, FiEdit2, FiPlus, FiMessageSquare } from 'react-icons/fi'
import axios from 'axios'
import { useNavigate } from 'react-router-dom';
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

  const handleDelete = (id: string) => {
    deleteMenu(id)
  }

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
    <div className="p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold cc-text-primary flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center shadow-md">
            <FiMessageSquare className="h-5 w-5 text-black" />
          </div>
          IVR Menus
        </h1>
        <button
          onClick={() => navigate('/new-ivr')}
          className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-4 py-2 rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200 shadow-md hover:shadow-lg font-medium flex items-center gap-2"
        >
          <FiPlus className="h-4 w-4" />
          Add IVR Menu
        </button>
      </div>

      {/* Table */}
      <div className="cc-glass rounded-lg shadow-md cc-border border overflow-hidden">
        {menus.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiMessageSquare className="h-8 w-8 cc-text-accent" />
            </div>
            <h3 className="text-lg font-semibold cc-text-primary mb-2">No IVR Menus Yet</h3>
            <p className="cc-text-secondary text-sm mb-4">Get started by creating your first IVR menu</p>
            <button
              onClick={() => navigate('/new-ivr')}
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-4 py-2 rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200 shadow-md font-medium inline-flex items-center gap-2"
            >
              <FiPlus className="h-4 w-4" />
              Create First Menu
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y cc-border">
              <thead className="cc-bg-surface">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold cc-text-secondary uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold cc-text-secondary uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold cc-text-secondary uppercase tracking-wider">
                    Options
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold cc-text-secondary uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold cc-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y cc-border">
                {menus.map((menu) => (
                  <tr key={menu._id} className="hover:bg-yellow-400/5 cc-transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-yellow-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FiMessageSquare className="h-4 w-4 cc-text-accent" />
                        </div>
                        <div className="font-medium cc-text-primary text-sm">{menu.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="cc-text-secondary text-sm max-w-md truncate">
                        {menu.description || 'No description'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-400/20 cc-text-accent">
                        {menu.options?.length || 0} options
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap cc-text-secondary text-sm">
                      {new Date(menu.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/ivr-menu/edit/${menu._id}`)}
                          className="inline-flex items-center gap-1 bg-yellow-400/10 cc-text-accent px-3 py-1.5 rounded-lg hover:bg-yellow-400/20 transition-all duration-200 font-medium border border-yellow-400/30"
                        >
                          <FiEdit2 className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(menu._id)}
                          className="inline-flex items-center bg-red-500/10 text-red-500 p-1.5 rounded-lg hover:bg-red-500/20 transition-all duration-200 border border-red-500/30"
                        >
                          <FiTrash className="h-3.5 w-3.5" />
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
  )
}