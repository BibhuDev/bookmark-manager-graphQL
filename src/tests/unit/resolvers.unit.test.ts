import { describe, it, expect, vi } from 'bun:test';
import { folderResolvers } from '../../schema/resolvers/folder.resolvers';
import { bookmarkResolvers } from '../../schema/resolvers/bookmark.resolvers';
import { ValidationError, NotFoundError } from '../../lib/errors';
import type { GraphQLContext } from '../../context';

describe('Resolvers Unit Tests', () => {
  const createMockContext = (overrides?: Partial<GraphQLContext['prisma']>): GraphQLContext => ({
    prisma: {
      folder: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      bookmark: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      ...overrides,
    } as unknown as GraphQLContext['prisma'],
  });

  describe('Validation', () => {
    it('throws ValidationError when creating a folder with whitespace-only name', async () => {
      const mockContext = createMockContext();

      await expect(
        folderResolvers.Mutation.createFolder(
          {},
          { input: { name: '   ' } },
          mockContext
        )
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when creating a bookmark with whitespace-only title', async () => {
      const mockContext = createMockContext();

      await expect(
        bookmarkResolvers.Mutation.createBookmark(
          {},
          {
            input: {
              title: '   ',
              url: 'https://example.com',
              folderId: 'folder-1',
            },
          },
          mockContext
        )
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when creating a bookmark with an invalid URL', async () => {
      const mockContext = createMockContext();

      await expect(
        bookmarkResolvers.Mutation.createBookmark(
          {},
          {
            input: {
              title: 'Valid Title',
              url: 'not-a-valid-url',
              folderId: 'folder-1',
            },
          },
          mockContext
        )
      ).rejects.toThrow(ValidationError);

      await expect(
        bookmarkResolvers.Mutation.createBookmark(
          {},
          {
            input: {
              title: 'Valid Title',
              url: 'ftp://example.com',
              folderId: 'folder-1',
            },
          },
          mockContext
        )
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Not Found Errors', () => {
    it('throws NotFoundError when querying a non-existent folder', async () => {
      const mockContext = createMockContext({
        folder: {
          findUnique: vi.fn().mockResolvedValue(null),
        } as unknown as GraphQLContext['prisma']['folder'],
      });

      await expect(
        folderResolvers.Query.folder({}, { id: 'non-existent-id' }, mockContext)
      ).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError when creating a bookmark in a non-existent folder', async () => {
      const mockContext = createMockContext({
        folder: {
          findUnique: vi.fn().mockResolvedValue(null),
        } as unknown as GraphQLContext['prisma']['folder'],
      });

      await expect(
        bookmarkResolvers.Mutation.createBookmark(
          {},
          {
            input: {
              title: 'Prisma Docs',
              url: 'https://www.prisma.io/docs',
              folderId: 'missing-folder-id',
            },
          },
          mockContext
        )
      ).rejects.toThrow(NotFoundError);
    });
  });
});