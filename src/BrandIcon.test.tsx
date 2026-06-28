import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BrandIcon } from "./BrandIcon";

describe("BrandIcon", () => {
    it("builds the expected URL with key, placeholder, and loading placeholder", () => {
        const html = renderToStaticMarkup(
            <BrandIcon
                domain="github.com"
                apiKey="bri_xxx_yyy_zzzzzzzzzzzzzzzz"
                placeholder="@empty"
                loadingPlaceholder="@loader-spin"
            />,
        );
        expect(html).toContain("/icons/github.com/medium");
        expect(html).toContain("key=bri_xxx_yyy_zzzzzzzzzzzzzzzz");
        expect(html).toContain("p=%40empty");
        expect(html).toContain("pl=%40loader-spin");
    });

    it("appends bg when background is set", () => {
        const html = renderToStaticMarkup(
            <BrandIcon
                domain="vercel.com"
                apiKey="bri_a_b_cccccccccccccccc"
                background="auto"
            />,
        );
        expect(html).toContain("bg=auto");
    });

    it("omits bg by default", () => {
        const html = renderToStaticMarkup(
            <BrandIcon domain="vercel.com" apiKey="bri_a_b_cccccccccccccccc" />,
        );
        expect(html).not.toContain("bg=");
    });

    it("respects custom size and base URL", () => {
        const html = renderToStaticMarkup(
            <BrandIcon
                domain="example.com"
                apiKey="bri_a_b_cccccccccccccccc"
                size="large"
                baseUrl="https://my-cdn.test"
            />,
        );
        expect(html).toContain("https://my-cdn.test/icons/example.com/large");
    });

    it("uses domain as default alt text", () => {
        const html = renderToStaticMarkup(
            <BrandIcon domain="stripe.com" apiKey="bri_a_b_cccccccccccccccc" />,
        );
        expect(html).toContain('alt="stripe.com"');
    });
});
