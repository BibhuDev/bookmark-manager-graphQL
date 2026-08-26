import type { GraphQLContext } from '../../context';
import { NotFoundError } from '../../lib/errors';
import { validateTitle, validateUrl } from '../../lib/validators';
import type {
  Bookmark,
  BookmarkEdge,
  BookmarkConnection,
  QueryBookmarksArgs,
  MutationCreateBookmarkArgs,
  MutationUpdateBookmarkArgs,
  MutationDeleteBookmarkArgs,
  MutationMoveBookmarkArgs,
} from '../types';

export const bookmarkResolvers = {
  Query: {
    bookmarks: async (
      _parent: unknown,
      { folderId, search, take = 10, cursor }: QueryBookmarksArgs,
      context: GraphQLContext
    ): Promise<BookmarkConnection> => {
      const limit = take ?? 10;
      const where: Record<string, unknown> = {};

      if (folderId) {
        where.folderId = folderId;
      }

      if (search) {
        where.OR = [
          { title: { contains: search } },
          { description: { contains: search } },
          { url: { contains: search } },
        ];
      }

      const totalCount = await context.prisma.bookmark.count({ where });

      const items = await context.prisma.bookmark.findMany({
        where,
        take: limit + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      });

      const hasNextPage = items.length > limit;
      const nodes = hasNextPage ? items.slice(0, limit) : items;

      const edges: BookmarkEdge[] = nodes.map((node) => ({
        cursor: node.id,
        node,
      }));

      const startCursor = edges[0]?.cursor ?? null;
      const endCursor = edges[edges.length - 1]?.cursor ?? null;

      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!cursor,
          startCursor,
          endCursor,
        },
        totalCount,
      };
    },
  },

  Mutation: {
    createBookmark: async (
      _parent: unknown,
      { input }: MutationCreateBookmarkArgs,
      context: GraphQLContext
    ) => {
      const title = validateTitle(input.title);
      const url = validateUrl(input.url);

      const folder = await context.prisma.folder.findUnique({
        where: { id: input.folderId },
      });

      if (!folder) {
        throw new NotFoundError(`Folder with ID "${input.folderId}" not found`);
      }

      return context.prisma.bookmark.create({
        data: {
          title,
          url,
          description: input.description?.trim() || null,
          folderId: input.folderId,
        },
      });
    },

    updateBookmark: async (
      _parent: unknown,
      { id, input }: MutationUpdateBookmarkArgs,
      context: GraphQLContext
    ) => {
      const existing = await context.prisma.bookmark.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundError(`Bookmark with ID "${id}" not found`);
      }

      const dataToUpdate: Record<string, unknown> = {};

      if (input.title !== undefined && input.title !== null) {
        dataToUpdate.title = validateTitle(input.title);
      }

      if (input.url !== undefined && input.url !== null) {
        dataToUpdate.url = validateUrl(input.url);
      }

      if (input.description !== undefined) {
        dataToUpdate.description = input.description?.trim() || null;
      }

      if (input.folderId !== undefined && input.folderId !== null) {
        const folder = await context.prisma.folder.findUnique({
          where: { id: input.folderId },
        });

        if (!folder) {
          throw new NotFoundError(`Folder with ID "${input.folderId}" not found`);
        }

        dataToUpdate.folderId = input.folderId;
      }

      return context.prisma.bookmark.update({
        where: { id },
        data: dataToUpdate,
      });
    },

    deleteBookmark: async (
      _parent: unknown,
      { id }: MutationDeleteBookmarkArgs,
      context: GraphQLContext
    ) => {
      const existing = await context.prisma.bookmark.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundError(`Bookmark with ID "${id}" not found`);
      }

      await context.prisma.bookmark.delete({
        where: { id },
      });

      return true;
    },

    moveBookmark: async (
      _parent: unknown,
      { id, folderId }: MutationMoveBookmarkArgs,
      context: GraphQLContext
    ) => {
      const bookmark = await context.prisma.bookmark.findUnique({
        where: { id },
      });

      if (!bookmark) {
        throw new NotFoundError(`Bookmark with ID "${id}" not found`);
      }

      const targetFolder = await context.prisma.folder.findUnique({
        where: { id: folderId },
      });

      if (!targetFolder) {
        throw new NotFoundError(`Target folder with ID "${folderId}" not found`);
      }

      return context.prisma.bookmark.update({
        where: { id },
        data: {
          folderId,
        },
      });
    },
  },

  Bookmark: {
    folder: async (parent: Bookmark, _args: unknown, context: GraphQLContext) => {
      const folder = await context.prisma.folder.findUnique({
        where: { id: parent.folderId },
      });

      if (!folder) {
        throw new NotFoundError(`Folder with ID "${parent.folderId}" not found`);
      }

      return folder;
    },
  },
};