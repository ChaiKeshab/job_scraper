export interface JobItem {
    title: string;
    company: string;
    type?: string | null;
    deadline?: string | null;
    postedDate?: string | null;
    logo?: string;
    link?: string;
    website?: string;
    location?: string;
    industry?: string;
    experience?: string | null;
    isEstimated: boolean; // if no postedDate present then we use scraped date as estimate with this flag as true
    tags: {
        level: LevelType;
        roles: string[];
    };
}


export type LevelType = "senior" | "mid" | "junior" | "intern" | "unknown";