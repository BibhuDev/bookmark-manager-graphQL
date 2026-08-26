import { describe, it, expect, beforeEach, afterAll } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createSchema, createYoga } from 'graphql-yoga';
import { resolvers } from '../../schema/resolvers';
import { prisma } from '../../lib/prisma';
import type { GraphQLContext } from '../../context';

const typeDefs = readFileSync(
  join(import.meta.dir, '../../schema/schema.graphql'),
  'utf-8'
);

const schema = createSchema({
  typeDefs,
  resolvers,
});

const yoga = createYoga<GraphQLContext>({
  schema,
  context: () => ({ prisma }),
});

const executeGraphQL = async (query: string, variables?: Record<string, unknown>) => {
  const response = await yoga.fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  return response.json();
};

describe('Bookmarks Integration Tests', () => {
  beforeEach(async () => {
    await prisma.bookmark.deleteMany({});
    await prisma.folder.deleteMany({});
  });

  afterAll(async () => {
    await prisma.bookmark.deleteMany({});
    await prisma.folder.deleteMany({});
    await prisma.$disconnect();
  });

  it('creates a folder and queries it with nested bookmarks', async () => {
    const createFolderRes = await executeGraphQL(`
      mutation {
        createFolder(input: { name: "Development" }) {
          id
          name
        }
      }
    `);

    const folderId = createFolderRes.data.createFolder.id;
    expect(createFolderRes.data.createFolder.name).toBe('Development');

    await executeGraphQL(
      `
      mutation CreateBookmark($input: CreateBookmarkInput!) {
        createBookmark(input: $input) {
          id
          title
          url
        }
      }
    `,
      {
        input: {
          title: 'Bun Official',
          url: 'https://bun.sh',
          folderId,
        },
      }
    );

    const folderQueryRes = await executeGraphQL(
      `
      query GetFolder($id: ID!) {
        folder(id: $id) {
          id
          name
          bookmarks {
            id
            title
            url
          }
        }
      }
    `,
      { id: folderId }
    );

    expect(folderQueryRes.data.folder.name).toBe('Development');
    expect(folderQueryRes.data.folder.bookmarks).toHaveLength(1);
    expect(folderQueryRes.data.folder.bookmarks[0].title).toBe('Bun Official');
  });

  it('slices cursor pagination correctly across multiple pages without overlap', async () => {
    const folder = await prisma.folder.create({
      data: { name: 'Reading List' },
    });

    for (let i = 1; i <= 5; i++) {
      await prisma.bookmark.create({
        data: {
          title: `Bookmark ${i}`,
          url: `https://example.com/${i}`,
          folderId: folder.id,
        },
      });
    }

    const page1Res = await executeGraphQL(`
      query {
        bookmarks(take: 2) {
          totalCount
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            cursor
            node {
              id
              title
            }
          }
        }
      }
    `);

    expect(page1Res.data.bookmarks.totalCount).toBe(5);
    expect(page1Res.data.bookmarks.edges).toHaveLength(2);
    expect(page1Res.data.bookmarks.pageInfo.hasNextPage).toBe(true);

    const page1Ids = page1Res.data.bookmarks.edges.map((e: { node: { id: string } }) => e.node.id);
    const endCursor1 = page1Res.data.bookmarks.pageInfo.endCursor;

    const page2Res = await executeGraphQL(
      `
      query GetBookmarks($cursor: String) {
        bookmarks(take: 2, cursor: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            cursor
            node {
              id
              title
            }
          }
        }
      }
    `,
      { cursor: endCursor1 }
    );

    expect(page2Res.data.bookmarks.edges).toHaveLength(2);
    expect(page2Res.data.bookmarks.pageInfo.hasNextPage).toBe(true);

    const page2Ids = page2Res.data.bookmarks.edges.map((e: { node: { id: string } }) => e.node.id);
    const overlap1And2 = page1Ids.filter((id: string) => page2Ids.includes(id));
    expect(overlap1And2).toHaveLength(0);

    const endCursor2 = page2Res.data.bookmarks.pageInfo.endCursor;
    const page3Res = await executeGraphQL(
      `
      query GetBookmarks($cursor: String) {
        bookmarks(take: 2, cursor: $cursor) {
          pageInfo {
            hasNextPage
          }
          edges {
            cursor
            node {
              id
            }
          }
        }
      }
    `,
      { cursor: endCursor2 }
    );

    expect(page3Res.data.bookmarks.edges).toHaveLength(1);
    expect(page3Res.data.bookmarks.pageInfo.hasNextPage).toBe(false);
  });

  it('moves a bookmark to another folder', async () => {
    const folderA = await prisma.folder.create({ data: { name: 'Folder A' } });
    const folderB = await prisma.folder.create({ data: { name: 'Folder B' } });

    const bookmark = await prisma.bookmark.create({
      data: {
        title: 'GraphQL Org',
        url: 'https://graphql.org',
        folderId: folderA.id,
      },
    });

    const moveRes = await executeGraphQL(
      `
      mutation MoveBookmark($id: ID!, $folderId: ID!) {
        moveBookmark(id: $id, folderId: $folderId) {
          id
          folderId
          folder {
            id
            name
          }
        }
      }
    `,
      { id: bookmark.id, folderId: folderB.id }
    );

    expect(moveRes.data.moveBookmark.folderId).toBe(folderB.id);
    expect(moveRes.data.moveBookmark.folder.name).toBe('Folder B');

    const updatedRecord = await prisma.bookmark.findUnique({
      where: { id: bookmark.id },
    });
    expect(updatedRecord?.folderId).toBe(folderB.id);
  });
});