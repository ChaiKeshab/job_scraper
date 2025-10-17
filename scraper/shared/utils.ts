import dayjs from "dayjs";
import type { LevelType } from "./types";
import * as chrono from "chrono-node";

const map = {
    frontend: ["front-end", "frontend", "front end", "react", "vue", "angular", "javascript", "typescript"],
    backend: ["back-end", "backend", "node", "express", "django", "flask", "spring", "rails"],
    fullstack: ["full-stack", "fullstack", "full stack"],
    qa: ["qa", "quality assurance", "test", "tester", "automation"],
    devops: ["devops", "infrastructure", "docker", "kubernetes"],
    mobile: ["mobile", "react native", "flutter", "android", "ios"],
    data: ["data", "ml", "ai", "python"],
} as const;

export function detectTags(title: string) {
    const lower = title.toLowerCase();

    // --- Level ---
    let level: LevelType = "unknown";
    if (/\b(senior|sr)\b/.test(lower)) level = "senior";
    else if (/\b(mid|intermediate)\b/.test(lower)) level = "mid";
    else if (/\b(junior|jr)\b/.test(lower)) level = "junior";
    else if (/\b(intern|internship)\b/.test(lower)) level = "intern";

    // --- Role / Tech ---
    const roleTags: string[] = [];

    for (const [tag, keywords] of Object.entries(map)) {
        if (keywords.some(k => lower.includes(k))) roleTags.push(tag);
    }

    if (roleTags.length === 0) roleTags.push("unknown");

    return { level, roles: roleTags };
}

export const chronoDate = (dateString: string) => {
    // chrono couldn't handle for x days remaining
    // 1. Match patterns like "3 days remaining"
    const remainingMatch = dateString.match(/(\d+)\s+days?\s+remaining/i);

    if (remainingMatch) {
        const days = parseInt(remainingMatch[1], 10);
        const targetDate = dayjs().add(days, "day").format("YYYY-MM-DD");
        return targetDate;
    }

    // 2. Fallback: Try normal chrono parsing for other formats
    const parsed = chrono.parse(dateString);

    if (parsed.length > 0) {
        const date = parsed[0].start.date();
        return dayjs(date).format("YYYY-MM-DD");
    }

    return null;
};


export const formattedDate = (date?: string | null) => {
    if (!date) return null;
    const parsed = dayjs(date);
    return parsed.isValid() ? parsed.format("YYYY-MM-DD") : null;
};
