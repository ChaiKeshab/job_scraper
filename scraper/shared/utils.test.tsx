import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectTags, chronoDate, formattedDate } from './utils';


describe('detectTags', () => {
    // --- Level Detection ---
    it('should correctly identify all experience levels', () => {
        expect(detectTags('Senior Software Engineer').level).toBe('senior');
        expect(detectTags('Sr. Backend Developer').level).toBe('senior');
        expect(detectTags('Mid-level Frontend Developer').level).toBe('mid');
        expect(detectTags('Intermediate QA Engineer').level).toBe('mid');
        expect(detectTags('Junior DevOps Engineer').level).toBe('junior');
        expect(detectTags('Jr. Mobile App Developer').level).toBe('junior');
        expect(detectTags('Software Engineer Intern').level).toBe('intern');
        expect(detectTags('Data Science Internship').level).toBe('intern');
    });

    it('should return "unknown" level if no keyword is found', () => {
        expect(detectTags('Software Developer').level).toBe('unknown');
    });

    // --- Role / Tech Detection ---
    it('should correctly identify a single role', () => {
        expect(detectTags('React Developer').roles).toEqual(['frontend']);
    });

    it('should identify multiple roles from a title', () => {
        const { roles } = detectTags('Full Stack Node.js and React Developer');
        // Use `toEqual(expect.arrayContaining(...))` to check for presence regardless of order
        expect(roles).toEqual(expect.arrayContaining(['frontend', 'backend', 'fullstack']));
    });

    it('should return ["unknown"] role if no keyword is found', () => {
        expect(detectTags('Product Manager').roles).toEqual(['unknown']);
    });

    // --- Combined & Edge Cases ---
    it('should correctly identify both level and roles and be case-insensitive', () => {
        const { level, roles } = detectTags('SENIOR FULL-STACK ENGINEER (DJANGO & VUE)');
        expect(level).toBe('senior');
        expect(roles).toEqual(expect.arrayContaining(['backend', 'frontend', 'fullstack']));
    });

    it('should handle empty strings gracefully', () => {
        expect(detectTags('')).toEqual({ level: 'unknown', roles: ['unknown'] });
    });
});


/**
 * We use fake timers to ensure tests are deterministic and not dependent on the current system time.
 */
describe('chronoDate', () => {
    // Set a fixed date (Thursday, Oct 16, 2025) before each test
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-10-16T10:00:00Z'));
    });

    // Restore real timers after each test
    afterEach(() => {
        vi.useRealTimers();
    });

    // --- smarthirepro listing format ---
    it('✅ should correctly parse "X days remaining" format', () => {
        expect(chronoDate('7 days remaining')).toBe('2025-10-23');
        expect(chronoDate('1 day remaining')).toBe('2025-10-17');
        expect(chronoDate('30 days remaining')).toBe('2025-11-15');
    });

    // --- Relative Future Dates ---
    it('should correctly parse other relative future dates', () => {
        expect(chronoDate('tomorrow')).toBe('2025-10-17');
        expect(chronoDate('in 5 days')).toBe('2025-10-21');
        // Based on Oct 16 (a Thursday), "next Friday" is not tomorrow, but the one after.
        expect(chronoDate('next Friday')).toBe('2025-10-24');
    });

    // --- Relative Past Dates ---
    it('should correctly parse relative past dates', () => {
        expect(chronoDate('yesterday')).toBe('2025-10-15');
        expect(chronoDate('2 weeks ago')).toBe('2025-10-02');
    });

    // --- Absolute Dates ---
    it('should correctly parse absolute date formats', () => {
        expect(chronoDate('October 31, 2025')).toBe('2025-10-31');
        expect(chronoDate('Jan 1 2026')).toBe('2026-01-01');
    });

    // --- Invalid Inputs ---
    it('should return null for unparseable or empty strings', () => {
        expect(chronoDate('not a valid date')).toBe(null);
        expect(chronoDate('some random text')).toBe(null);
        expect(chronoDate('')).toBe(null);
    });
});


describe("formattedDate", () => {
    it("should correctly format valid date strings to 'YYYY-MM-DD'", () => {
        expect(formattedDate('2025-10-16T10:00:00Z')).toBe('2025-10-16');
        expect(formattedDate('2026-01-01')).toBe('2026-01-01');
        expect(formattedDate('10/31/2025')).toBe('2025-10-31');
    });

    it("should handle edge cases like leap years correctly", () => {
        expect(formattedDate('2024-02-29')).toBe('2024-02-29');
    });

    it("should return null for null or undefined inputs", () => {
        expect(formattedDate(null)).toBe(null);
        expect(formattedDate(undefined)).toBe(null);
    });

    it("should return null for invalid date strings", () => {
        expect(formattedDate('invalid date')).toBe(null);
        expect(formattedDate('')).toBe(null);
    });

    it("should not change already formatted 'YYYY-MM-DD' strings", () => {
        expect(formattedDate('2025-12-25')).toBe('2025-12-25');
    });
});
