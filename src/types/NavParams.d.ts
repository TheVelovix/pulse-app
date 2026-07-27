export interface ProjectDetailsParams {
  id: string;
  name: string;
  domain: string;
  createdAt: string;
  isPublic: string;
  publicSlug: string;
}

export interface GaImportParams {
  projectId: string;
  // JSON-encoded GaProperty[], serialized by the backend's OAuth callback
  properties: string;
  accessToken: string;
}
