import type { GraphQLContext } from '../../context';
import { NotFoundError } from '../../lib/errors';
import { validateTitle } from '../../lib/validators';
import type {
  Folder,
  QueryFolderArgs,
  MutationCreateFolderArgs,
} from '../types';

export const folderResolvers = {
  Query: {
    folders: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      return context.prisma.folder.findMany({
        orderBy: { createdAt: 'desc' },
      });
    },

    folder: async (
      _parent: unknown,
      { id }: QueryFolderArgs,
      context: GraphQLContext
    ) => {
      const folder = await context.prisma.folder.findUnique({
        where: { id },
      });

      if (!folder) {
        throw new NotFoundError(`Folder with ID "${id}" not found`);
      }

      return folder;
    },
  },

  Mutation: {
    createFolder: async (
      _parent: unknown,
      { input }: MutationCreateFolderArgs,
      context: GraphQLContext
    ) => {
      const validatedName = validateTitle(input.name);

      return context.prisma.folder.create({
        data: {
          name: validatedName,
        },
      });
    },
  },

  Folder: {
    bookmarks: async (parent: Folder, _args: unknown, context: GraphQLContext) => {
      return context.prisma.bookmark.findMany({
        where: { folderId: parent.id },
        orderBy: { createdAt: 'desc' },
      });
    },
  },
};