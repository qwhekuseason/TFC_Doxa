import { 
  collection,
  getDocs,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  increment,
  getDoc,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import type { Family, FamilyRequest, AdminRequest, User, Post, Notification, Media, Comment } from '../types';
import { db, storage } from './firebase';
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

/* ==================== FAMILIES ==================== */

export const getAllFamilies = async (): Promise<Family[]> => {
  try {
    const snap = await getDocs(collection(db, 'families'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Family));
  } catch (error) {
    console.error('Error fetching all families:', error);
    return [];
  }
};

export const getFamilies = async (): Promise<Family[]> => {
  return getAllFamilies();
};

export const getFamily = async (familyId: string): Promise<Family | null> => {
  try {
    const snap = await getDoc(doc(db, 'families', familyId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Family;
    }
    return null;
  } catch (error) {
    console.error('Error fetching family:', error);
    return null;
  }
};

export const createFamily = async (data: Omit<Family, 'id' | 'createdAt' | 'memberCount'> & { id?: string }) => {
  const id = data.id ?? undefined;
  const payload = {
    ...data,
    memberCount: (data as any).memberCount ?? 0,
    createdAt: serverTimestamp()
  } as any;
  if (id) {
    await setDoc(doc(db, 'families', id), payload, { merge: true });
    return id;
  }
  const ref = await addDoc(collection(db, 'families'), payload);
  return ref.id;
};

export const updateFamily = async (familyId: string, updates: Partial<Family>) => {
  const famRef = doc(db, 'families', familyId);
  await updateDoc(famRef, { ...updates, updatedAt: serverTimestamp() } as any);
};

export const deleteFamily = async (familyId: string) => {
  await deleteDoc(doc(db, 'families', familyId));
};

/* ==================== USERS ==================== */

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
};

export const getUsersByFamily = async (familyId: string): Promise<User[]> => {
  try {
    const col = collection(db, 'users');
    const q = query(col, where('familyId', '==', familyId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
  } catch (error) {
    console.error('Error fetching family members:', error);
    return [];
  }
};

export const createUserProfile = async (
  userId: string,
  userData: Partial<User>
) => {
  const userRef = doc(db, 'users', userId);
  const payload = {
    id: userId,
    email: (userData as any)?.email ?? '',
    displayName: (userData as any)?.displayName ?? '',
    role: (userData as any)?.role ?? 'member',
    phoneNumber: (userData as any)?.phoneNumber ?? '',
    familyId: (userData as any)?.familyId ?? null,
    createdAt: serverTimestamp()
  } as any;

  await setDoc(userRef, payload, { merge: true });

  if (payload.familyId) {
    const famRef = doc(db, 'families', payload.familyId);
    try {
      await updateDoc(famRef, { memberCount: increment(1) });
    } catch (e) {
      console.warn('Failed to update family memberCount', e);
    }

    try {
      await createNotification({
        familyId: payload.familyId,
        title: 'New Member',
        message: `${payload.displayName || payload.email} joined the family`,
        type: 'general',
        isRead: false,
        createdBy: userId
      } as any);
    } catch (e) {
      console.warn('Failed to create join notification', e);
    }
  }

  return payload;
};

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { ...updates, updatedAt: serverTimestamp() } as any);
};

export const updateUserFamily = async (userId: string, newFamilyId: string | null) => {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) throw new Error('User not found');

  const prevFamilyId = (snap.data() as any).familyId ?? null;
  await updateDoc(userRef, { familyId: newFamilyId ?? null, updatedAt: serverTimestamp() } as any);

  if (prevFamilyId && prevFamilyId !== newFamilyId) {
    const prevFamRef = doc(db, 'families', prevFamilyId);
    try { await updateDoc(prevFamRef, { memberCount: increment(-1) }); } catch(e){ console.warn(e); }
  }
  if (newFamilyId && prevFamilyId !== newFamilyId) {
    const newFamRef = doc(db, 'families', newFamilyId);
    try { await updateDoc(newFamRef, { memberCount: increment(1) }); } catch(e){ console.warn(e); }

    try {
      await createNotification({
        familyId: newFamilyId,
        title: 'New Member',
        message: `A new member has joined the family!`,
        type: 'general',
        isRead: false,
        createdBy: userId
      } as any);
    } catch (e) {
      console.warn('Failed to create join notification', e);
    }
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  const uSnap = await getDoc(userRef);
  const u = uSnap.exists() ? (uSnap.data() as any) : null;
  if (u?.familyId) {
    const famRef = doc(db, 'families', u.familyId);
    try { await updateDoc(famRef, { memberCount: increment(-1) }); } catch(e){ console.warn(e); }
  }
  await deleteDoc(userRef);
};

export const promoteToAdmin = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { role: 'admin', updatedAt: serverTimestamp() } as any);
};

export const demoteFromAdmin = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { role: 'member', updatedAt: serverTimestamp() } as any);
};

export const removeMemberFromFamily = async (userId: string) => {
  await updateUserFamily(userId, null);
};

export const checkAdminLimit = async (familyId: string, maxAdmins: number = 3): Promise<boolean> => {
  const col = collection(db, 'users');
  const q = query(col, where('familyId', '==', familyId), where('role', '==', 'admin'));
  const snap = await getDocs(q);
  return snap.docs.length < maxAdmins;
};

/* ==================== POSTS ==================== */

export const getAllPosts = async (): Promise<Post[]> => {
  try {
    const snap = await getDocs(collection(db, 'posts'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
  } catch (error: any) {
    // If Firestore rules block this read, return empty list instead of throwing
    if (error?.code === 'permission-denied' || /permission/i.test(error?.message || '')) {
      console.warn('getAllPosts: permission denied — returning empty list.');
      return [];
    }
    console.error('Error fetching all posts:', error);
    return [];
  }
};

export const getFamilyPosts = async (familyId: string): Promise<Post[]> => {
  try {
    const col = collection(db, 'posts');
    const q = query(col, where('familyId', '==', familyId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Post)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching family posts:', error);
    return [];
  }
};

export const createPost = async (post: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments'>) => {
  const docRef = await addDoc(collection(db, 'posts'), {
    ...post,
    likes: [],
    comments: [],
    createdAt: serverTimestamp()
  } as any);
  return docRef.id;
};

export const updatePost = async (postId: string, updates: Partial<Post>) => {
  const postRef = doc(db, 'posts', postId);
  await updateDoc(postRef, { ...updates, updatedAt: serverTimestamp() } as any);
};

export const deletePost = async (postId: string): Promise<void> => {
  await deleteDoc(doc(db, 'posts', postId));
};

export const likePost = async (postId: string, userId: string) => {
  const postRef = doc(db, 'posts', postId);
  const snap = await getDoc(postRef);
  if (!snap.exists()) throw new Error('Post not found');
  
  const post = snap.data() as any;
  const likes = post.likes ?? [];
  if (!likes.includes(userId)) {
    likes.push(userId);
    await updateDoc(postRef, { likes });
  }
};

export const unlikePost = async (postId: string, userId: string) => {
  const postRef = doc(db, 'posts', postId);
  const snap = await getDoc(postRef);
  if (!snap.exists()) throw new Error('Post not found');
  
  const post = snap.data() as any;
  const likes = (post.likes ?? []).filter((uid: string) => uid !== userId);
  await updateDoc(postRef, { likes });
};

export const addComment = async (postId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => {
  const postRef = doc(db, 'posts', postId);
  const snap = await getDoc(postRef);
  if (!snap.exists()) throw new Error('Post not found');
  
  const post = snap.data() as any;
  const comments = post.comments ?? [];
  const newComment = {
    id: `${Date.now()}`,
    ...comment,
    createdAt: new Date()
  };
  comments.push(newComment);
  await updateDoc(postRef, { comments });
};

export const deleteComment = async (postId: string, commentId: string) => {
  const postRef = doc(db, 'posts', postId);
  const snap = await getDoc(postRef);
  if (!snap.exists()) throw new Error('Post not found');
  
  const post = snap.data() as any;
  const comments = (post.comments ?? []).filter((c: any) => c.id !== commentId);
  await updateDoc(postRef, { comments });
};

/* ==================== MEDIA ==================== */

export const getFamilyMedia = async (familyId: string): Promise<Media[]> => {
  try {
    const col = collection(db, 'media');
    const q = query(col, where('familyId', '==', familyId));
    const snap = await getDocs(q);
    return (snap.docs.map(d => ({ id: d.id, ...d.data() } as any)).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) as Media[]);
  } catch (error) {
    console.error('Error fetching family media:', error);
    return [];
  }
};

export const uploadMedia = async (
  file: File,
  familyId: string,
  type: 'photo' | 'audio' = 'photo',
  title?: string,
  uploadedBy?: string | null
) => {
  if (!storage) throw new Error('Firebase storage is not initialized');

  const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  const path = `families/${familyId}/media/${fileName}`;
  const ref = storageRef(storage, path);
  const task = uploadBytesResumable(ref, file);

  await new Promise<void>((resolve, reject) => {
    task.on('state_changed', () => {}, (err) => reject(err), () => resolve());
  });

  const url = await getDownloadURL(ref);

  const docRef = await addDoc(collection(db, 'media'), {
    familyId,
    url,
    filePath: path,
    type,
    title: title ?? file.name,
    fileName,
    size: file.size,
    uploadedBy: uploadedBy ?? null,
    createdAt: serverTimestamp()
  } as any);

  return { id: docRef.id, url };
};

export const deleteMedia = async (mediaId: string) => {
  const mediaRef = doc(db, 'media', mediaId);
  const snap = await getDoc(mediaRef);
  if (!snap.exists()) throw new Error('Media not found');
  
  const data = snap.data() as any;
  if (data?.filePath && storage) {
    try {
      const sRef = storageRef(storage, data.filePath);
      await deleteObject(sRef);
    } catch (e) {
      console.warn('Failed to delete storage object', e);
    }
  }
  await deleteDoc(mediaRef);
};

/* ==================== NOTIFICATIONS ==================== */

export const getFamilyNotifications = async (familyId: string): Promise<Notification[]> => {
  try {
    const col = collection(db, 'notifications');
    const q = query(col, where('familyId', '==', familyId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

export const createNotification = async (notif: Omit<Notification, 'id' | 'createdAt'>) => {
  const payload = { ...notif, createdAt: serverTimestamp() } as any;
  const ref = await addDoc(collection(db, 'notifications'), payload);
  return ref.id;
};

export const markNotificationAsRead = async (notificationId: string) => {
  const notifRef = doc(db, 'notifications', notificationId);
  await updateDoc(notifRef, { isRead: true });
};

export const deleteNotification = async (notificationId: string) => {
  await deleteDoc(doc(db, 'notifications', notificationId));
};

/* ==================== FAMILY REQUESTS ==================== */

export const getFamilyRequests = async (status?: FamilyRequest['status']): Promise<FamilyRequest[]> => {
  try {
    const col = collection(db, 'familyRequests');
    const q = status ? query(col, where('status', '==', status)) : col;
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FamilyRequest));
  } catch (error) {
    console.error('Error fetching family requests:', error);
    return [];
  }
};

export const createFamilyRequest = async (request: Omit<FamilyRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
  const docRef = await addDoc(collection(db, 'familyRequests'), {
    ...request,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  } as any);
  return docRef.id;
};

export const approveFamilyRequest = async (requestId: string, familyData?: Partial<Family>) => {
  const reqRef = doc(db, 'familyRequests', requestId);
  const reqDoc = await getDoc(reqRef);
  
  if (!reqDoc.exists()) throw new Error('Request not found');

  await updateDoc(reqRef, { status: 'approved', reviewedAt: serverTimestamp() } as any);
  
  const payload = familyData ?? (reqDoc.data() as any);
  await createFamily(payload as any);
};

export const rejectFamilyRequest = async (requestId: string) => {
  const reqRef = doc(db, 'familyRequests', requestId);
  await updateDoc(reqRef, { status: 'rejected', reviewedAt: serverTimestamp() } as any);
};

/* ==================== ADMIN REQUESTS ==================== */

export const getAdminRequests = async (status?: AdminRequest['status']): Promise<AdminRequest[]> => {
  try {
    const col = collection(db, 'adminRequests');
    const q = status ? query(col, where('status', '==', status)) : col;
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminRequest));
  } catch (error) {
    console.error('Error fetching admin requests:', error);
    return [];
  }
};

export const createAdminRequest = async (userData: Omit<AdminRequest, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(db, 'adminRequests'), {
    ...userData,
    status: 'pending',
    createdAt: serverTimestamp()
  } as any);
  return docRef.id;
};

export const reviewAdminRequest = async (
  requestId: string,
  status: 'approved' | 'rejected',
  reviewerId: string
) => {
  const requestRef = doc(db, 'adminRequests', requestId);
  const request = await getDoc(requestRef);

  if (!request.exists()) throw new Error('Admin request not found');

  const requestData = request.data() as AdminRequest;

  await updateDoc(requestRef, {
    status,
    reviewedAt: serverTimestamp(),
    reviewedBy: reviewerId
  } as any);

  if (status === 'approved') {
    const userRef = doc(db, 'users', requestData.userId);
    await updateDoc(userRef, { role: 'admin', updatedAt: serverTimestamp() } as any);
  }
};

/* ==================== REAL-TIME LISTENERS ==================== */

export const subscribeToUserProfile = (userId: string, callback: (user: User | null) => void): Unsubscribe => {
  const userRef = doc(db, 'users', userId);
  return onSnapshot(userRef, (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() } as User);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error listening to user profile:', error);
    callback(null);
  });
};

export const subscribeToFamilyMembers = (familyId: string, callback: (members: User[]) => void): Unsubscribe => {
  const col = collection(db, 'users');
  const q = query(col, where('familyId', '==', familyId));
  return onSnapshot(q, (snap) => {
    const members = snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
    callback(members);
  }, (error) => {
    console.error('Error listening to family members:', error);
    callback([]);
  });
};

export const subscribeToFamilyNotifications = (familyId: string, callback: (notifs: Notification[]) => void): Unsubscribe => {
  const col = collection(db, 'notifications');
  const q = query(col, where('familyId', '==', familyId));
  return onSnapshot(q, (snap) => {
    const notifs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
    callback(notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, (error) => {
    console.error('Error listening to notifications:', error);
    callback([]);
  });
};

export const subscribeToFamilyPosts = (familyId: string, callback: (posts: Post[]) => void): Unsubscribe => {
  const col = collection(db, 'posts');
  const q = query(col, where('familyId', '==', familyId));
  return onSnapshot(q, (snap) => {
    const posts = snap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
    callback(posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, (error) => {
    console.error('Error listening to posts:', error);
    callback([]);
  });
};

export const subscribeToFamilyMedia = (familyId: string, callback: (media: Media[]) => void): Unsubscribe => {
  const col = collection(db, 'media');
  const q = query(col, where('familyId', '==', familyId));
  return onSnapshot(q, (snap) => {
    const media = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    media.sort((a: any, b: any) => {
      const getTime = (v: any) => v?.toDate ? v.toDate().getTime() : (v ? new Date(v).getTime() : 0);
      return getTime(b?.createdAt) - getTime(a?.createdAt);
    });
    callback(media as Media[]);
  }, (error) => {
    console.error('Error listening to media:', error);
    callback([]);
  });
};

export const subscribeToAdminRequests = (callback: (requests: AdminRequest[]) => void): Unsubscribe => {
  const col = collection(db, 'adminRequests');
  const q = query(col, where('status', '==', 'pending'));
  return onSnapshot(q, (snap) => {
    const requests = snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminRequest));
    callback(requests);
  }, (error) => {
    console.error('Error listening to admin requests:', error);
    callback([]);
  });
};

/* ==================== ANALYTICS & STATS ==================== */

export const getFamilyStats = async (familyId: string) => {
  try {
    const members = await getUsersByFamily(familyId);
    const posts = await getFamilyPosts(familyId);
    const media = await getFamilyMedia(familyId);
    const notifications = await getFamilyNotifications(familyId);

    return {
      memberCount: members.length,
      adminCount: members.filter(m => m.role === 'admin').length,
      postCount: posts.length,
      mediaCount: media.length,
      notificationCount: notifications.length,
      unreadNotificationCount: notifications.filter(n => !n.isRead).length
    };
  } catch (error) {
    console.error('Error fetching family stats:', error);
    return null;
  }
};