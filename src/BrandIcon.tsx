import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";

export type IconSize = "ico" | "small" | "medium" | "large" | "vector";
export type IconState = "loading" | "not-found" | "provisional";

const DEFAULT_BASE_URL = "https://cdn.brandicons.dev";
const RETRY_DELAYS_MS = [5_000, 15_000, 45_000, 60_000, 90_000, 120_000, 300_000];
const PROVISIONAL_DELAY_MS = 300_000;

export interface BrandIconProps
    extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "loading"> {
    /** Domain to fetch icon for, e.g. "github.com" */
    domain: string;
    /** Public, domain-locked API key */
    apiKey: string;
    /** Icon size — defaults to "medium" */
    size?: IconSize;
    /**
     * Placeholder shown when the icon is definitively not found, e.g. "@empty"
     * (the default), "@letter", "@globe-dark", "@globe:ffffff:1f2937", or the name
     * of a placeholder you've uploaded. Omit it and the server uses "@empty".
     */
    placeholder?: string;
    /** Placeholder shown while the backend is still searching, e.g. "@loader-spin" */
    loadingPlaceholder?: string;
    /** Override CDN base URL */
    baseUrl?: string;
    /** Disable automatic polling/retry */
    retry?: boolean;
}

function buildUrl(opts: {
    baseUrl: string;
    domain: string;
    size: IconSize;
    apiKey: string;
    placeholder?: string;
    loadingPlaceholder?: string;
}): string {
    const params = new URLSearchParams({ key: opts.apiKey });
    if (opts.placeholder) params.set("p", opts.placeholder);
    if (opts.loadingPlaceholder) params.set("pl", opts.loadingPlaceholder);
    return `${opts.baseUrl}/icons/${encodeURIComponent(opts.domain)}/${opts.size}?${params}`;
}

/**
 * Renders a brand icon with auto-retry while the server is still searching.
 *
 * The component issues a HEAD request after each load to inspect the
 * `x-brandicons-state` header. While the state is "loading" it schedules
 * additional checks at backoff intervals (5s, 15s, 45s, 2m, 5m); once the
 * header reports "not-found" or disappears (real icon now in S3), polling
 * stops. HEAD requests share the same CloudFront cache key as the GET, so
 * repeat polls are typically served from the edge.
 */
export function BrandIcon({
    domain,
    apiKey,
    size = "medium",
    placeholder,
    loadingPlaceholder,
    baseUrl = DEFAULT_BASE_URL,
    retry = true,
    alt,
    ...imgProps
}: BrandIconProps) {
    const url = buildUrl({ baseUrl, domain, size, apiKey, placeholder, loadingPlaceholder });
    const [bust, setBust] = useState(0);
    const attemptRef = useRef(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        attemptRef.current = 0;
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            abortRef.current?.abort();
        };
    }, [url]);

    const scheduleNext = (delayMs: number) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setBust((n) => n + 1);
        }, delayMs);
    };

    const checkState = async () => {
        if (!retry) return;
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const res = await fetch(url, { method: "HEAD", signal: controller.signal });
            const state = res.headers.get("x-brandicons-state") as IconState | null;

            if (!state) {
                // Real icon now in S3 (no state header); nothing more to do.
                return;
            }
            if (state === "not-found") {
                return;
            }
            if (state === "provisional") {
                scheduleNext(PROVISIONAL_DELAY_MS);
                return;
            }
            if (state === "loading") {
                const delay = RETRY_DELAYS_MS[attemptRef.current];
                if (delay !== undefined) {
                    attemptRef.current += 1;
                    scheduleNext(delay);
                }
            }
        } catch {
            // network error / aborted — stop retrying
        }
    };

    const src = bust === 0 ? url : `${url}&_=${bust}`;

    return (
        // eslint-disable-next-line jsx-a11y/alt-text
        <img
            {...imgProps}
            src={src}
            alt={alt ?? domain}
            onLoad={(e) => {
                imgProps.onLoad?.(e);
                checkState();
            }}
        />
    );
}
