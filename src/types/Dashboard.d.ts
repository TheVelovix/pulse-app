export interface Project {
  id: string;
  name: string;
  domain: string;
  createdAt: string;
  isPublic: boolean;
  publicSlug: string | null;
}
export interface NewProjectBody {
  name: string;
  domain: string;
}
