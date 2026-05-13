export interface WikiPageDto {
  id: number;
  title: string;
  slug: string;
  content: string | null;
  projectId: number;
  parentId: number | null;
  position: number;
  authorId: number;
  authorName: string;
  linkedTaskIds: number[];
  updatedAt: string;
  children: WikiPageDto[];
}

export interface WikiTreeItem {
  id: number;
  title: string;
  slug: string;
  parentId: number | null;
  position: number;
  children: WikiTreeItem[];
}

export interface CreateWikiPageRequest {
  title: string;
  content?: string;
  parentId?: number | null;
  linkedTaskIds?: number[];
}

export interface UpdateWikiPageRequest {
  title?: string;
  content?: string;
  parentId?: number | null;
  linkedTaskIds?: number[];
}

export interface WikiSearchHit {
  id: number;
  title: string;
  slug: string;
}