export type UserRole = "owner" | "admin" | "user";
export type UserStatus = "prospect" | "active" | "suspended" | "expired";
export type CourseType = "L1" | "L2" | "L3" | "CRFPA";

export interface User {
  id: string;
  email: string;
  prenom: string;
  nom: string;
  role: UserRole;
  status: UserStatus;
  picture_url?: string;
  profile_image_url?: string;
  must_change_password: boolean;
  offer_expires_at?: string;
  created_by?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserCourseAccess {
  id: string;
  user_id: string;
  course: CourseType;
  granted_at: string;
  granted_by?: string;
  expires_at?: string;
  created_at: string;
}

export interface TemporaryPassword {
  id: string;
  user_id: string;
  temp_password_hash: string;
  created_at: string;
  used_at?: string;
  expires_at: string;
  created_by: string;
}

export interface CreateUserData {
  email: string;
  prenom: string;
  nom: string;
  status?: UserStatus;
  courses?: CourseType[];
  offer_expires_at?: string;
}
