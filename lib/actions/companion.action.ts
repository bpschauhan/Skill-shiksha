'use server';

import {auth} from "@clerk/nextjs/server";
import {getSqlClient} from "@/lib/db";
import { revalidatePath } from "next/cache";

const normalizeFilter = (value?: string | string[]) => {
    const filter = Array.isArray(value) ? value[0] : value;
    return filter?.trim() || null;
}

export const createCompanion = async (formData: CreateCompanion) => {
    const { userId: author } = await auth();
    const sql = getSqlClient();

    const data = await sql`
        INSERT INTO companions (name, subject, topic, voice, style, duration, author)
        VALUES (
            ${formData.name},
            ${formData.subject},
            ${formData.topic},
            ${formData.voice},
            ${formData.style},
            ${formData.duration},
            ${author}
        )
        RETURNING *
    ` as Companion[];

    if(!data[0]) throw new Error('Failed to create a companion');

    return data[0] as Companion;
}

export const getAllCompanions = async ({ limit = 10, page = 1, subject, topic }: GetAllCompanions) => {
    const sql = getSqlClient();
    const subjectFilter = normalizeFilter(subject);
    const topicFilter = normalizeFilter(topic);
    const topicPattern = topicFilter ? `%${topicFilter}%` : null;
    const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 50));
    const safeOffset = Math.max(0, ((Number(page) || 1) - 1) * safeLimit);

    try {
        const companions = await sql`
            SELECT *
            FROM companions
            WHERE (${subjectFilter}::text IS NULL OR subject = ${subjectFilter})
              AND (
                ${topicPattern}::text IS NULL
                OR topic ILIKE ${topicPattern}
                OR name ILIKE ${topicPattern}
              )
            ORDER BY created_at DESC
            LIMIT ${safeLimit}
            OFFSET ${safeOffset}
        ` as Companion[];

        const uniqueCompanions = companions.filter((companion, index, self) =>
            index === self.findIndex(c => c.id === companion.id)
        );

        return uniqueCompanions;
    } catch (err) {
        console.error('Fetch error in getAllCompanions:', err);
        throw new Error('Failed to fetch companions. Check network or database config.');
    }
}

export const getCompanion = async (id: string) => {
    const sql = getSqlClient();

    const data = await sql`
        SELECT *
        FROM companions
        WHERE id = ${id}
        LIMIT 1
    ` as Companion[];

    return data[0] as Companion | undefined;
}

export const addToSessionHistory = async (companionId: string) => {
    const { userId } = await auth();
    if (!userId) return;
    const sql = getSqlClient();

    const data = await sql`
        INSERT INTO session_history (companion_id, user_id)
        VALUES (${companionId}, ${userId})
        RETURNING *
    ` as SessionHistory[];

    return data;
}

export const getRecentSessions = async (limit = 10) => {
    const sql = getSqlClient();
    const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 50));

    const data = await sql`
        SELECT c.*
        FROM session_history sh
        JOIN companions c ON c.id = sh.companion_id
        ORDER BY sh.created_at DESC
        LIMIT ${safeLimit}
    ` as Companion[];

    return data;
}

export const getUserSessions = async (userId: string, limit = 10) => {
    const sql = getSqlClient();
    const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 50));

    const data = await sql`
        SELECT c.*
        FROM session_history sh
        JOIN companions c ON c.id = sh.companion_id
        WHERE sh.user_id = ${userId}
        ORDER BY sh.created_at DESC
        LIMIT ${safeLimit}
    ` as Companion[];

    return data;
}

export const getUserCompanions = async (userId: string) => {
    const sql = getSqlClient();

    const data = await sql`
        SELECT *
        FROM companions
        WHERE author = ${userId}
        ORDER BY created_at DESC
    ` as Companion[];

    return data;
}

export const newCompanionPermissions = async () => {
    const { userId, has } = await auth();
    const sql = getSqlClient();

    let limit = 0;

    if(has({ plan: 'pro' })) {
        return true;
    } else if(has({ feature: "3_companion_limit" })) {
        limit = 3;
    } else if(has({ feature: "10_companion_limit" })) {
        limit = 10;
    }

    const data = await sql`
        SELECT COUNT(*)::int AS count
        FROM companions
        WHERE author = ${userId}
    ` as { count: number }[];

    const companionCount = Number(data[0]?.count || 0);

    return companionCount < limit;
}

// Bookmarks
export const addBookmark = async (companionId: string, path: string) => {
  const { userId } = await auth();
  if (!userId) return;
  const sql = getSqlClient();
  const data = await sql`
    INSERT INTO bookmarks (companion_id, user_id)
    VALUES (${companionId}, ${userId})
    ON CONFLICT (companion_id, user_id) DO NOTHING
    RETURNING *
  ` as Bookmark[];
  // Revalidate the path to force a re-render of the page

  revalidatePath(path);
  return data;
};

export const removeBookmark = async (companionId: string, path: string) => {
  const { userId } = await auth();
  if (!userId) return;
  const sql = getSqlClient();
  const data = await sql`
    DELETE FROM bookmarks
    WHERE companion_id = ${companionId}
      AND user_id = ${userId}
    RETURNING *
  ` as Bookmark[];
  revalidatePath(path);
  return data;
};

// It's almost the same as getUserCompanions, but it's for the bookmarked companions
export const getBookmarkedCompanions = async (userId: string) => {
  const sql = getSqlClient();
  const data = await sql`
    SELECT c.*
    FROM bookmarks b
    JOIN companions c ON c.id = b.companion_id
    WHERE b.user_id = ${userId}
    ORDER BY b.created_at DESC
  ` as Companion[];
  // We don't need the bookmarks data, so we return only the companions
  return data;
};
