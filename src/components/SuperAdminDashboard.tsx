import { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  getAllFamilies,
  getFamilyRequests,
  getAllUsers,
  getAllPosts,
  approveFamilyRequest,
  rejectFamilyRequest,
  createFamily,
  deletePost,
  deleteUser,
  createNotification,
  getAdminRequests,
  reviewAdminRequest
} from '../lib/firestore';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import type { Family, FamilyRequest, User, Post, AdminRequest } from '../types';
import {
  Trash2,
  Check,
  X,
  PlusCircle,
  Users,
  FileText,
  Bell,
  BarChart3,
  Shield,
  AlertCircle,
  TrendingUp,
  Activity
} from 'lucide-react';

interface SuperAdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuperAdminDashboard({ isOpen, onClose }: SuperAdminDashboardProps) {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'families' | 'users' | 'content' | 'admins'>('overview');

  const [families, setFamilies] = useState<Family[]>([]);
  const [familyRequests, setFamilyRequests] = useState<FamilyRequest[]>([]);
  const [adminRequests, setAdminRequests] = useState<AdminRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState({
    totalFamilies: 0,
    totalUsers: 0,
    totalPosts: 0,
    pendingFamilyRequests: 0,
    pendingAdminRequests: 0
  });

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [f, fr, ar, u, p] = await Promise.all([
        getAllFamilies(),
        getFamilyRequests('pending'),
        getAdminRequests('pending'),
        getAllUsers(),
        getAllPosts()
      ]);

      setFamilies(f);
      setFamilyRequests(fr);
      setAdminRequests(ar);
      setUsers(u);
      setPosts(p || []);

      setStats({
        totalFamilies: f.length,
        totalUsers: u.length,
        totalPosts: (p || []).length,
        pendingFamilyRequests: fr.length,
        pendingAdminRequests: ar.length
      });
    } catch (err: any) {
      console.error('Super admin load error', err);
      setError(err?.message || 'Failed to load some super-admin data');
      setFamilies((c) => c ?? []);
      setFamilyRequests((c) => c ?? []);
      setAdminRequests((c) => c ?? []);
      setUsers((c) => c ?? []);
      setPosts((c) => c ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleApproveFamilyRequest = async (req: FamilyRequest) => {
    if (!window.confirm(`Approve family request: ${req.familyName}?`)) return;

    setProcessing(req.id ?? 'approve-family');
    try {
      await approveFamilyRequest(req.id!, {
        name: req.familyName,
        description: req.description || '',
        imageUrl: undefined,
        memberCount: 0,
        createdAt: new Date()
      });

      await createNotification({
        familyId: (await getAllFamilies()).find(f => f.name === req.familyName)?.id || '',
        title: 'Family Approved',
        message: `Your family "${req.familyName}" has been approved and created!`,
        type: 'general',
        isRead: false,
        createdBy: 'super_admin'
      } as any);

      await loadData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to approve request');
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectFamilyRequest = async (req: FamilyRequest) => {
    if (!window.confirm(`Reject family request: ${req.familyName}?`)) return;

    setProcessing(req.id ?? 'reject-family');
    try {
      await rejectFamilyRequest(req.id!);
      await loadData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to reject request');
    } finally {
      setProcessing(null);
    }
  };

  const handleApproveAdminRequest = async (req: AdminRequest) => {
    if (!window.confirm(`Approve admin request from ${req.email}?`)) return;

    setProcessing(req.id ?? 'approve-admin');
    try {
      await reviewAdminRequest(req.id!, 'approved', 'super_admin');
      await loadData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to approve admin request');
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectAdminRequest = async (req: AdminRequest) => {
    if (!window.confirm(`Reject admin request from ${req.email}?`)) return;

    setProcessing(req.id ?? 'reject-admin');
    try {
      await reviewAdminRequest(req.id!, 'rejected', 'super_admin');
      await loadData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to reject admin request');
    } finally {
      setProcessing(null);
    }
  };

  const handleCreateFamily = async () => {
    const name = prompt('Enter family name:');
    if (!name) return;
    const desc = prompt('Enter family description (optional):') || '';

    setProcessing('create-family');
    try {
      await createFamily({
        name,
        description: desc,
        imageUrl: undefined,
        memberCount: 0
      } as any);
      await loadData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create family');
    } finally {
      setProcessing(null);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm('Delete this post?')) return;

    setProcessing(id);
    try {
      await deletePost(id);
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to delete post');
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Delete this user? This will remove their Firestore profile.')) return;

    setProcessing(id);
    try {
      await deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to delete user');
    } finally {
      setProcessing(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
      <div className={`h-full w-full flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 shadow-xl`}>
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Super Admin Console</h1>
                  <p className="text-sm text-blue-100">Comprehensive platform management</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={async () => { await signOut(auth); window.location.reload(); }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-lg transition-all text-sm font-medium"
                >
                  Logout
                </button>

                <button
                  onClick={onClose}
                  className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-all"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className={`border-b ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white/50'} backdrop-blur-sm`}>
          <div className="max-w-7xl mx-auto px-6">
            <nav className="flex gap-1 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'requests', label: 'Requests', icon: Bell, badge: stats.pendingFamilyRequests + stats.pendingAdminRequests },
                { id: 'families', label: 'Families', icon: Users },
                { id: 'users', label: 'Users', icon: Activity },
                { id: 'content', label: 'Content', icon: FileText },
                { id: 'admins', label: 'Admin Requests', icon: Shield, badge: stats.pendingAdminRequests }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-5 py-4 font-medium flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-900/10 dark:text-blue-400'
                      : isDarkMode
                      ? 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.badge ? (
                    <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white">
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-96">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mb-4" />
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Loading dashboard data...</p>
              </div>
            ) : (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                      {[
                        { label: 'Families', value: stats.totalFamilies, icon: Users, color: 'blue', gradient: 'from-blue-500 to-blue-600' },
                        { label: 'Users', value: stats.totalUsers, icon: Activity, color: 'green', gradient: 'from-green-500 to-green-600' },
                        { label: 'Posts', value: stats.totalPosts, icon: FileText, color: 'violet', gradient: 'from-violet-500 to-violet-600' },
                        { label: 'Family Requests', value: stats.pendingFamilyRequests, icon: Bell, color: 'orange', gradient: 'from-orange-500 to-orange-600' },
                        { label: 'Admin Requests', value: stats.pendingAdminRequests, icon: Shield, color: 'red', gradient: 'from-red-500 to-red-600' }
                      ].map((stat, i) => (
                        <div
                          key={i}
                          className={`relative p-6 rounded-2xl ${
                            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                          } hover:shadow-lg transition-shadow`}
                        >
                          <div className={`absolute top-4 right-4 w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center opacity-10`}>
                            <stat.icon className="w-6 h-6" />
                          </div>
                          <div className="relative">
                            <div className={`text-3xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {stat.value}
                            </div>
                            <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {stat.label}
                            </div>
                            <div className="mt-3 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                              <TrendingUp className="w-3 h-3" />
                              <span>Active</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Quick Actions */}
                      <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100'}`}>
                        <h3 className={`font-semibold text-lg mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          <PlusCircle className="w-5 h-5 text-blue-600" />
                          Quick Actions
                        </h3>
                        <button
                          onClick={handleCreateFamily}
                          disabled={processing === 'create-family'}
                          className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
                        >
                          {processing === 'create-family' ? 'Creating...' : '+ Create New Family'}
                        </button>
                      </div>

                      {/* Recent Activity */}
                      <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                        <h3 className={`font-semibold text-lg mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Recent Posts</h3>
                        <div className="space-y-3">
                          {posts.slice(0, 3).map(p => (
                            <div key={p.id} className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                              <div className={`font-medium text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                {p.authorName || p.authorId}
                              </div>
                              <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} line-clamp-1`}>
                                {p.content?.slice(0, 60)}...
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Requests Tab */}
                {activeTab === 'requests' && (
                  <div className="space-y-6">
                    <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Pending Requests
                    </h3>
                    {familyRequests.length === 0 ? (
                      <div className={`text-center py-12 rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                        <Bell className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>No pending family requests</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {familyRequests.map(req => (
                          <div key={req.id} className={`p-5 rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} hover:shadow-md transition-shadow`}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {req.familyName}
                                </h4>
                                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {req.description}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApproveFamilyRequest(req)}
                                  disabled={processing === req.id}
                                  className="p-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-green-500/20"
                                  title="Approve"
                                >
                                  <Check className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleRejectFamilyRequest(req)}
                                  disabled={processing === req.id}
                                  className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-red-500/20"
                                  title="Reject"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Families Tab */}
                {activeTab === 'families' && (
                  <div>
                    <h3 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      All Families ({families.length})
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {families.map(fam => (
                        <div key={fam.id} className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} hover:shadow-lg transition-shadow`}>
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                              <Users className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <h4 className={`font-semibold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {fam.name}
                          </h4>
                          <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                            {fam.description}
                          </p>
                          <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {fam.memberCount} {fam.memberCount === 1 ? 'member' : 'members'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                  <div>
                    <h3 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      All Users ({users.length})
                    </h3>
                    <div className={`rounded-2xl overflow-hidden ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                      <table className="w-full">
                        <thead className={isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}>
                          <tr>
                            <th className={`px-6 py-4 text-left text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>User</th>
                            <th className={`px-6 py-4 text-left text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</th>
                            <th className={`px-6 py-4 text-left text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Role</th>
                            <th className={`px-6 py-4 text-right text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {users.map(user => (
                            <tr key={user.id} className={`${isDarkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'} transition-colors`}>
                              <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-medium">
                                    {(user.displayName || user.email).charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-medium">{user.displayName || user.email}</span>
                                </div>
                              </td>
                              <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {user.email}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  user.role === 'super_admin'
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    : user.role === 'admin'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                }`}>
                                  {user.role.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  disabled={processing === user.id || user.role === 'super_admin'}
                                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Delete user"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Content Tab */}
                {activeTab === 'content' && (
                  <div>
                    <h3 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      All Posts ({posts.length})
                    </h3>
                    {posts.length === 0 ? (
                      <div className={`text-center py-12 rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                        <FileText className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>No posts yet</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {posts.map(post => (
                          <div key={post.id} className={`p-5 rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} hover:shadow-md transition-shadow`}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {post.authorName || post.authorId}
                                </div>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                                  {post.content}
                                </p>
                                <div className="mt-2">
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {post.type.replace('-', ' ')}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                disabled={processing === post.id}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                title="Delete post"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Admin Requests Tab */}
                {activeTab === 'admins' && (
                  <div>
                    <h3 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Admin Requests ({adminRequests.length})
                    </h3>
                    {adminRequests.length === 0 ? (
                      <div className={`text-center py-12 rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                        <Shield className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>No pending admin requests</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {adminRequests.map(req => (
                          <div key={req.id} className={`p-5 rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} hover:shadow-md transition-shadow`}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {req.displayName}
                                </h4>
                                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {req.email}
                                </p>
                                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                  {req.phoneNumber}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApproveAdminRequest(req)}
                                  disabled={processing === req.id}
                                  className="p-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-green-500/20"
                                  title="Approve"
                                >
                                  <Check className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleRejectAdminRequest(req)}
                                  disabled={processing === req.id}
                                  className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-red-500/20"
                                  title="Reject"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
