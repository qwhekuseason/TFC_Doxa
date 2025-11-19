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
  AlertCircle
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
        // getAllPosts may return [] if permissions blocked
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
      // do not throw — surface a friendly message and keep UI usable
      console.error('Super admin load error', err);
      setError(err?.message || 'Failed to load some super-admin data (check permissions).');
      // keep lists stable (empty fallback)
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
    <div className={`fixed inset-0 z-50 ${isDarkMode ? 'bg-black/50' : 'bg-black/30'} backdrop-blur-sm`}>
      <div className={`h-full w-full max-w-6xl mx-auto flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-l-3xl shadow-2xl`}>
        {/* Header */}
        <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-6 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <Shield className={`w-8 h-8 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Super Admin Console</h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage all families, users, and content</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={async () => { await signOut(auth); window.location.reload(); }}
              title="Logout"
              className={`px-3 py-2 rounded-md text-sm ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
            >
              Logout
            </button>

            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className={`border-b ${isDarkMode ? 'border-red-900 bg-red-900/20' : 'border-red-200 bg-red-50'} px-6 py-3 flex items-center gap-3`}>
            <AlertCircle className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
            <p className={isDarkMode ? 'text-red-400' : 'text-red-700'}>{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex overflow-x-auto`}>
          {[{
            id: 'overview',
            label: 'Overview',
            icon: BarChart3
          },
          {
            id: 'requests',
            label: 'Requests',
            icon: Bell,
            badge: stats.pendingFamilyRequests + stats.pendingAdminRequests
          },
          {
            id: 'families',
            label: 'Families',
            icon: Users
          },
          {
            id: 'users',
            label: 'Users',
            icon: Users
          },
          {
            id: 'content',
            label: 'Content',
            icon: FileText
          },
          {
            id: 'admins',
            label: 'Admin Requests',
            icon: Shield,
            badge: stats.pendingAdminRequests
          }].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-4 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? isDarkMode
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-indigo-600 text-indigo-600'
                  : isDarkMode
                  ? 'border-transparent text-gray-400 hover:text-gray-300'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge && (
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${isDarkMode ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-700'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDarkMode ? 'border-indigo-400' : 'border-indigo-600'}`} />
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      {
                        label: 'Families',
                        value: stats.totalFamilies,
                        color: 'blue'
                      },
                      {
                        label: 'Users',
                        value: stats.totalUsers,
                        color: 'purple'
                      },
                      {
                        label: 'Posts',
                        value: stats.totalPosts,
                        color: 'green'
                      },
                      {
                        label: 'Family Requests',
                        value: stats.pendingFamilyRequests,
                        color: 'yellow'
                      },
                      {
                        label: 'Admin Requests',
                        value: stats.pendingAdminRequests,
                        color: 'red'
                      }
                    ].map((stat, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-xl ${
                          isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-gray-50 to-gray-100'
                        }`}
                      >
                        <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {stat.label}
                        </div>
                        <div className={`text-3xl font-bold mt-2 ${
                          stat.color === 'blue' ? isDarkMode ? 'text-blue-400' : 'text-blue-600' :
                          stat.color === 'purple' ? isDarkMode ? 'text-purple-400' : 'text-purple-600' :
                          stat.color === 'green' ? isDarkMode ? 'text-green-400' : 'text-green-600' :
                          stat.color === 'yellow' ? isDarkMode ? 'text-yellow-400' : 'text-yellow-600' :
                          isDarkMode ? 'text-red-400' : 'text-red-600'
                        }`}>
                          {stat.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Quick Actions */}
                    <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200'}`}>
                      <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <PlusCircle className="w-5 h-5" />
                        Quick Actions
                      </h3>
                      <button
                        onClick={handleCreateFamily}
                        disabled={processing === 'create-family'}
                        className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                          isDarkMode
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-gray-600'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-gray-400'
                        }`}
                      >
                        {processing === 'create-family' ? 'Creating...' : '+ Create New Family'}
                      </button>
                    </div>

                    {/* Recent Activity */}
                    <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Recent Posts</h3>
                      <div className="space-y-2">
                        {posts.slice(0, 3).map(p => (
                          <div key={p.id} className={`p-2 rounded text-sm ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
                            <div className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {p.authorName || p.authorId}
                            </div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                              {p.content?.slice(0, 50)}...
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
                  <div>
                    <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Family Requests ({familyRequests.length})
                    </h3>
                    {familyRequests.length === 0 ? (
                      <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>No pending family requests</p>
                    ) : (
                      <div className="space-y-3">
                        {familyRequests.map(req => (
                          <div key={req.id} className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
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
                                  className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:bg-gray-600"
                                >
                                  <Check className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleRejectFamilyRequest(req)}
                                  disabled={processing === req.id}
                                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:bg-gray-600"
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
                </div>
              )}

              {/* Families Tab */}
              {activeTab === 'families' && (
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    All Families ({families.length})
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {families.map(fam => (
                      <div key={fam.id} className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {fam.name}
                            </h4>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {fam.description}
                            </p>
                            <div className={`mt-3 text-xs font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                              👥 {fam.memberCount} members
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    All Users ({users.length})
                  </h3>
                  <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                          <tr>
                            <th className={`px-4 py-3 text-left text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name</th>
                            <th className={`px-4 py-3 text-left text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</th>
                            <th className={`px-4 py-3 text-left text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Role</th>
                            <th className={`px-4 py-3 text-right text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map(user => (
                            <tr key={user.id} className={`border-t ${isDarkMode ? 'border-gray-700 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                              <td className={`px-4 py-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                {user.displayName || user.email}
                              </td>
                              <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {user.email}
                              </td>
                              <td className={`px-4 py-3 text-sm`}>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.role === 'super_admin'
                                    ? isDarkMode ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-700'
                                    : user.role === 'admin'
                                    ? isDarkMode ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-100 text-indigo-700'
                                    : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                                }`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className={`px-4 py-3 text-right`}>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  disabled={processing === user.id || user.role === 'super_admin'}
                                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
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
                </div>
              )}

              {/* Content Tab */}
              {activeTab === 'content' && (
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    All Posts ({posts.length})
                  </h3>
                  <div className="space-y-3">
                    {posts.length === 0 ? (
                      <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>No posts yet</p>
                    ) : (
                      posts.map(post => (
                        <div key={post.id} className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {post.authorName || post.authorId}
                              </div>
                              <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {post.content?.slice(0, 150)}...
                              </p>
                              <div className={`mt-2 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                {post.type}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              disabled={processing === post.id}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:text-gray-400"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      )))
                    }
                  </div>
                </div>
              )}

              {/* Admin Requests Tab */}
              {activeTab === 'admins' && (
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Admin Requests ({adminRequests.length})
                  </h3>
                  {adminRequests.length === 0 ? (
                    <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>No pending admin requests</p>
                  ) : (
                    <div className="space-y-3">
                      {adminRequests.map(req => (
                        <div key={req.id} className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {req.displayName}
                              </h4>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
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
                                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:bg-gray-600"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleRejectAdminRequest(req)}
                                disabled={processing === req.id}
                                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:bg-gray-600"
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
  );
}

/* Firestore security rules removed from TSX file — move these into your Firestore rules file (e.g. firestore.rules).

function isSignedIn() { return request.auth != null; }
function isSuperAdmin() {
  return isSignedIn() &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
}

match /posts/{postId} {
  // allow super_admin to read all posts
  allow read: if isSuperAdmin() || (request.auth != null && resource.data.familyId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.familyId);
  // existing create/update/delete logic...
}

*/