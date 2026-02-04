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
}

export interface Comment {
  id?: number;
  content: string;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface Like {
  id?: number;
  createdAt?: string;
  updatedAt?: string | null;
}
