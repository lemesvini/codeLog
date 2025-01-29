export interface FileItem {
    id: string;
    name: string;
    type: 'file' | 'folder';
    content?: string;
    language?: string;
    parentId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }