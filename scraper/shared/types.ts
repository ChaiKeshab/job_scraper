export interface JobItem {
    title: string;
    company: string;
    type: string;
    deadline: string;
    logo: string;
    link: string;
    tags: {
        level: LevelType;
        roles: string[];
    };
}

export type LevelType = "senior" | "mid" | "junior" | "intern" | "unknown";