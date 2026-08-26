export interface Folder {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt?: Date;
  bookmarks?: Bookmark[];
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  description?: string | null;
  tags?: string[];
  folderId: string;
  folder?: Folder;
  createdAt: Date;
  updatedAt?: Date;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string | null;
  endCursor?: string | null;
}

export interface BookmarkEdge {
  cursor: string;
  node: Bookmark;
}

export interface BookmarkConnection {
  edges: BookmarkEdge[];
  pageInfo: PageInfo;
  totalCount: number;
}

export interface CreateFolderInput {
  name: string;
}

export interface CreateBookmarkInput {
  title: string;
  url: string;
  description?: string | null;
  folderId: string;
}

export interface UpdateBookmarkInput {
  title?: string | null;
  url?: string | null;
  description?: string | null;
  folderId?: string | null;
}

export interface QueryFoldersArgs {}

export interface QueryFolderArgs {
  id: string;
}

export interface QueryBookmarksArgs {
  folderId?: string | null;
  search?: string | null;
  take?: number | null;
  cursor?: string | null;
}

export interface MutationCreateFolderArgs {
  input: CreateFolderInput;
}

export interface MutationCreateBookmarkArgs {
  input: CreateBookmarkInput;
}

export interface MutationUpdateBookmarkArgs {
  id: string;
  input: UpdateBookmarkInput;
}

export interface MutationDeleteBookmarkArgs {
  id: string;
}

export interface MutationMoveBookmarkArgs {
  id: string;
  folderId: string;
}