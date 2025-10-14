import type { LevelType } from "./shared/types";

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



export const cleanText = (text?: string | null) => {
    return text?.replace(/\s+/g, " ").trim() || "";
};


