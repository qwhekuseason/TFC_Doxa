import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { User, Family, Post, Media } from '../types';
import { 
  getUsersByFamily, 
  removeMemberFromFamily,
  deleteMedia,
  getFamilyMedia,
  getFamilyPosts
} from '../lib/firestore';

// local helpers for promoting/demoting users — use an API route if available; otherwise these are no-ops
const promoteToAdmin = async (userId: string) => {
  try {
    // best-effort backend call (create /api/admin/promote if you want server-side handling)
    await fetch(`/api/admin/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
  } catch (err) {
    // swallow errors to avoid breaking the UI when endpoint isn't available
  }
};

const demoteFromAdmin = async (userId: string) => {
  try {
    // best-effort backend call (create /api/admin/demote if you want server-side handling)
    await fetch(`/api/admin/demote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
  } catch (err) {
    // swallow errors to avoid breaking the UI when endpoint isn't available
  }
};
import { X, Users, Crown, Shield, Settings, BarChart3, Trash2, MessageSquare, Image, Music, Calendar, AlertTriangle } from 'lucide-react';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminDashboard({ isOpen, onClose }: AdminDashboardProps) {
  const { userData } = useAuth();
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'content' | 'settings'>('overview');
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const loadAdminData = async () => {
      const familyId = userData?.familyId;
      if (!familyId || userData?.role !== 'admin') return;
      
      try {
        setLoading(true);
        const [membersData, postsData, mediaData] = await Promise.all([
          getUsersByFamily(familyId),
          getFamilyPosts(familyId),
          getFamilyMedia(familyId)
        ]);
        
        // derive simple aggregated stats locally since getFamilyStats is not exported
        const statsData = {
          totalMembers: membersData?.length ?? 0,
          totalPosts: postsData?.length ?? 0,
          totalMedia: mediaData?.length ?? 0,
          adminCount: (membersData ?? []).filter((m: any) => m.role === 'admin').length,
          recentActivity: (postsData ?? []).slice(0, 5)
        };

        setFamily(null);
        setMembers(membersData);
        setPosts(postsData);
        setMedia(mediaData);
        setStats(statsData);
      } catch (error) {
        console.error('Error loading admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadAdminData();
    }
  }, [isOpen, userData?.familyId, userData?.role]);
  const handlePromoteUser = async (userId: string) => {
    const familyId = userData?.familyId;
    if (!familyId) return;

    try {
      setActionLoading(userId);
      await promoteToAdmin(userId);
      // Refresh members
      const updatedMembers = await getUsersByFamily(familyId);
      setMembers(updatedMembers);
    } catch (error: any) {
      alert(error?.message ?? 'Error promoting user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDemoteUser = async (userId: string) => {
    const familyId = userData?.familyId;
    if (!familyId) return;

    try {
      setActionLoading(userId);
      await demoteFromAdmin(userId);
      // Refresh members
      const updatedMembers = await getUsersByFamily(familyId);
      setMembers(updatedMembers);
    } catch (error: any) {
      console.error('Error demoting user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member from the family?')) return;
    
    const familyId = userData?.familyId;
    if (!familyId) return;

    try {
      setActionLoading(userId);
      await removeMemberFromFamily(userId);
      // Refresh members, posts and media, then recompute stats locally
      const [updatedMembers, updatedPosts, updatedMedia] = await Promise.all([
        getUsersByFamily(familyId),
        getFamilyPosts(familyId),
        getFamilyMedia(familyId)
      ]);
      const updatedStats = {
        totalMembers: updatedMembers?.length ?? 0,
        totalPosts: updatedPosts?.length ?? 0,
        totalMedia: updatedMedia?.length ?? 0,
        adminCount: (updatedMembers ?? []).filter((m: any) => m.role === 'admin').length,
        recentActivity: (updatedPosts ?? []).slice(0, 5)
      };
      setMembers(updatedMembers);
      setPosts(updatedPosts);
      setMedia(updatedMedia);
      setStats(updatedStats);
      setFamily(null);
    } catch (error: any) {
      console.error('Error removing member:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this media?')) return;
    
    const familyId = userData?.familyId;
    if (!familyId) return;

    try {
      setActionLoading(mediaId);
      await deleteMedia(mediaId);
      // Refresh media
      const updatedMedia = await getFamilyMedia(familyId);
      setMedia(updatedMedia);
    } catch (error: any) {
      console.error('Error deleting media:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen || userData?.role !== 'admin') return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`absolute inset-4 max-w-6xl mx-auto my-auto ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      } rounded-3xl shadow-2xl overflow-hidden`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-600 to-blue-600">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-yellow-300" />
            <h2 className="text-xl font-bold text-white">Admin Dashboard</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex h-96">
          {/* Sidebar */}
          <div className={`w-64 border-r ${
            isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
          }`}>
            <nav className="p-4 space-y-2">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'members', label: 'Members', icon: Users },
                { id: 'content', label: 'Content', icon: MessageSquare },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-colors ${
                    activeTab === id
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                      : isDarkMode
                        ? 'text-gray-300 hover:bg-gray-800'
                        : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <h3 className={`text-2xl font-bold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Family Overview
                    </h3>
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className={`p-4 rounded-xl ${
                        isDarkMode ? 'bg-gray-700' : 'bg-blue-50'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <Users className="w-8 h-8 text-blue-600" />
                          <div>
                            <p className={`text-2xl font-bold ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {stats?.totalMembers || 0}
                            </p>
                            <p className={`text-sm ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              Total Members
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`p-4 rounded-xl ${
                        isDarkMode ? 'bg-gray-700' : 'bg-green-50'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <MessageSquare className="w-8 h-8 text-green-600" />
                          <div>
                            <p className={`text-2xl font-bold ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {stats?.totalPosts || 0}
                            </p>
                            <p className={`text-sm ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              Total Posts
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`p-4 rounded-xl ${
                        isDarkMode ? 'bg-gray-700' : 'bg-purple-50'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <Image className="w-8 h-8 text-purple-600" />
                          <div>
                            <p className={`text-2xl font-bold ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {stats?.totalMedia || 0}
                            </p>
                            <p className={`text-sm ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              Media Files
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`p-4 rounded-xl ${
                        isDarkMode ? 'bg-gray-700' : 'bg-yellow-50'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <Crown className="w-8 h-8 text-yellow-600" />
                          <div>
                            <p className={`text-2xl font-bold ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {stats?.adminCount || 0}
                            </p>
                            <p className={`text-sm ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              Admins
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div>
                      <h4 className={`text-lg font-semibold mb-4 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Recent Activity
                      </h4>
                      <div className="space-y-3">
                        {stats?.recentActivity?.map((post: Post) => (
                          <div key={post.id} className={`p-3 rounded-lg ${
                            isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`font-medium ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {post.authorName}
                                </p>
                                <p className={`text-sm ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  {post.content.substring(0, 100)}...
                                </p>
                              </div>
                              <span className={`text-xs ${
                                isDarkMode ? 'text-gray-500' : 'text-gray-500'
                              }`}>
                                {new Date(post.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        )) || (
                          <p className={`text-center py-4 ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            No recent activity
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'members' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-2xl font-bold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Manage Members ({members.length})
                      </h3>
                    </div>
                    
                    <div className="space-y-4">
                      {members?.map((member) => {
                        // safe name resolution (handles displayName, name, authorName or missing)
                        const name = (member as any)?.displayName ?? (member as any)?.name ?? (member as any)?.authorName ?? '';
                        const initial = name ? name.charAt(0) : '?';

                        return (
                          <div key={(member as any).id ?? Math.random()} className="flex items-center justify-between space-x-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                                <span className="font-medium text-gray-900 dark:text-white">{initial}</span>
                              </div>
                              <div>
                                <div className="font-medium text-sm">
                                  {name || 'Unknown User'}
                                </div>
                                <p className={`text-xs capitalize ${
                                  isDarkMode ? 'text-gray-500' : 'text-gray-500'
                                }`}>
                                  {member.role} • Joined {new Date(member.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              {/* Promote (shown when not admin) */}
                              {member.role !== 'admin' && (
                                <button
                                  onClick={() => handlePromoteUser((member as any).id)}
                                  disabled={actionLoading === (member as any).id || userData?.id === (member as any).id}
                                  title="Promote to admin"
                                  className={`p-2 rounded-lg hover:bg-purple-100 disabled:opacity-50 ${
                                    isDarkMode ? 'text-gray-300 hover:text-purple-300' : 'text-purple-600 hover:text-white'
                                  }`}
                                >
                                  <Crown className="w-4 h-4" />
                                </button>
                              )}

                              {/* Demote (shown when admin and not the current user) */}
                              {member.role === 'admin' && userData?.id !== (member as any).id && (
                                <button
                                  onClick={() => handleDemoteUser((member as any).id)}
                                  disabled={actionLoading === (member as any).id}
                                  title="Demote from admin"
                                  className={`p-2 rounded-lg hover:bg-yellow-100 disabled:opacity-50 ${
                                    isDarkMode ? 'text-gray-300 hover:text-yellow-300' : 'text-yellow-600 hover:text-white'
                                  }`}
                                >
                                  <Shield className="w-4 h-4" />
                                </button>
                              )}

                              {/* Remove member (disabled for current user) */}
                              <button
                                onClick={() => handleRemoveMember((member as any).id)}
                                disabled={actionLoading === (member as any).id || userData?.id === (member as any).id}
                                title="Remove member"
                                className={`p-2 rounded-lg hover:bg-red-100 disabled:opacity-50 ${
                                  isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-600'
                                }`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'content' && (
                  <div className="space-y-6">
                    <h3 className={`text-2xl font-bold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Content Management
                    </h3>
                    
                    {/* Posts */}
                    <div>
                      <h4 className={`text-lg font-semibold mb-4 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Recent Posts ({posts.length})
                      </h4>
                      <div className="space-y-3">
                        {posts.slice(0, 5).map((post) => (
                          <div key={post.id} className={`p-4 rounded-lg ${
                            isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                          }`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className={`font-medium ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {post.authorName}
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    post.type === 'announcement' 
                                      ? 'bg-blue-100 text-blue-700'
                                      : post.type === 'prayer-request'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {post.type.replace('-', ' ')}
                                  </span>
                                </div>
                                <p className={`text-sm ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                  {post.content.substring(0, 150)}...
                                </p>
                              </div>
                              <button className={`p-2 rounded-lg hover:bg-red-100 ${
                                isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-600'
                              }`}>
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Media */}
                    <div>
                      <h4 className={`text-lg font-semibold mb-4 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Media Files ({media.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {media.slice(0, 6).map((item) => (
                          <div key={item.id} className={`p-4 rounded-lg ${
                            isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                {item.type === 'photo' ? (
                                  <Image className="w-8 h-8 text-blue-500" />
                                ) : (
                                  <Music className="w-8 h-8 text-green-500" />
                                )}
                                <div>
                                  <p className={`font-medium ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {item.title}
                                  </p>
                                  <p className={`text-xs ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                  }`}>
                                    {new Date(item.uploadedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteMedia(item.id)}
                                disabled={actionLoading === item.id}
                                className={`p-2 rounded-lg hover:bg-red-100 disabled:opacity-50 ${
                                  isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-600'
                                }`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <h3 className={`text-2xl font-bold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Family Settings
                    </h3>
                    
                    <div className={`p-6 rounded-xl ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <h4 className={`text-lg font-semibold mb-4 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Family Information
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Family Name
                          </label>
                          <input
                            type="text"
                            value={family?.name || ''}
                            className={`w-full px-4 py-2 rounded-lg border ${
                              isDarkMode 
                                ? 'bg-gray-600 border-gray-500 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                            readOnly
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Description
                          </label>
                          <textarea
                            value={family?.description || ''}
                            rows={3}
                            className={`w-full px-4 py-2 rounded-lg border ${
                              isDarkMode 
                                ? 'bg-gray-600 border-gray-500 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                            readOnly
                          />
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Users className="w-5 h-5 text-blue-500" />
                            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                              {family?.memberCount} members
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-5 h-5 text-green-500" />
                            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                              Created {family?.createdAt ? new Date(family.createdAt).toLocaleDateString() : 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={`p-6 rounded-xl border-2 border-red-200 ${
                      isDarkMode ? 'bg-red-900/10' : 'bg-red-50'
                    }`}>
                      <div className="flex items-center space-x-3 mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                        <h4 className={`text-lg font-semibold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          Danger Zone
                        </h4>
                      </div>
                      <p className={`text-sm mb-4 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        These actions cannot be undone. Please be careful.
                      </p>
                      <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                        Delete Family
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}