export type UserRole = 'super_admin' | 'admin' | 'member';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  familyId?: string;
  phoneNumber?: string;
  createdAt: any;
}

export interface Family {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  memberCount: number;
  createdAt: Date;
}

export interface Media {
  id: string;
  familyId: string;
  type: 'photo' | 'audio';
  title: string;
  description?: string;
  url: string;
  downloadUrl: string;
  uploadedBy: string;
  uploadedAt: Date;
  tags?: string[];
}

export interface Post {
  id: string;
  familyId: string;
  authorId: string;
  authorName: string;
  content: string;
  type: 'announcement' | 'discussion' | 'prayer-request';
  createdAt: Date;
  likes: string[];
  comments: Comment[];
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  familyId: string;
  title: string;
  message: string;
  type: 'announcement' | 'media' | 'general';
  isRead: boolean;
  createdAt: Date;
}

export interface FamilyRequest {
  id?: string;
  requesterId: string;
  requesterName: string;
  familyName: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  updatedAt: any;
}

export interface AdminRequest {
  id?: string;
  userId: string;
  email: string;
  displayName: string;
  phoneNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  reviewedAt?: any;
  reviewedBy?: string;
  reason?: string;
}

export interface InitialSetupConfig {
  superAdmin: {
    email: string;
    password: string;
    displayName: string;
    phoneNumber: string;
  };
  churchName: string;
}