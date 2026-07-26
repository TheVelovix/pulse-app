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
export interface NewProjectProps {
  isVisible: boolean;
  onClose: (refetchProjects:boolean) => void;
}
export interface ProjectSettingsProps {
  isVisible: boolean;
  onClose: () => void;
  project?: Project;
  updateProjectVisibility: (projectId: string, isPublic: boolean) => void;
  afterDelete: () => void;
}
export interface CopyScriptParams {
  isVisible: boolean;
  close: () => void;
  projectId: string;
}
