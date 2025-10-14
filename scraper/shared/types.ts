export interface JobItem {
    title: string;
    company: string;
    type: string;
    deadline?: string; // raw text, parsed later into ISO
    postedDate?: string; // raw text, parsed later into ISO
    logo?: string;
    link: string;
    website?: string;
    location?: string;
    industry?: string;
    isEstimated: boolean; // flag if fallback logic used
    tags: {
        level: string;
        roles: string[];
    };
}


export type LevelType = "senior" | "mid" | "junior" | "intern" | "unknown";