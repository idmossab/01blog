export interface UserResponse {
  userId: number;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  status: string;
  role: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
}

export interface Blog {
  idBlog?: number;
  title: string;
  content: string;
  status?: string;
  media?: string | null;
  commentCount?: number;
  likeCount?: number;
  createdAt?: string;
  updatedAt?: string | null;
  user?: UserResponse;
}

export interface Media {
  id?: number;
  url: string;
  mediaType?: string;
  createdAt?: string;
}

export interface Comment {
  id?: number;
  content: string;
  createdAt?: string;
  updatedAt?: string | null;
  user?: UserResponse;
}

export interface Like {
  id?: number;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface LikeStatus {
  liked: boolean;
  likeCount: number;
}

export interface FollowCounts {
  following: number;
  followers: number;
}

export type ReportReason =
  | 'HARASSMENT_BULLYING'
  | 'SPAM_SCAM'
  | 'HATE_SPEECH'
  | 'VIOLENCE_THREATS'
  | 'SEXUAL_CONTENT'
  | 'COPYRIGHT_IP'
  | 'OTHER';

export interface CreateReportRequest {
  blogId: number;
  reason: ReportReason;
  details?: string | null;
}

export interface ReportResponse {
  reportId: number;
  message: string;
}

export type NotificationType = 'LIKE' | 'COMMENT' | 'FOLLOW';

export interface AppNotification {
  id: number;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
  actorUserId?: number | null;
  actorUserName?: string | null;
  blogId?: number | null;
}
