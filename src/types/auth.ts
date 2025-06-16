export type User = {
  id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin';
};

export type AuthResponse = {
  user: User;
  token: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterCredentials = LoginCredentials & {
  name: string;
};
