# react-brandicons

Tiny React component for [BrandIcons](https://brandicons.dev). Renders a brand
icon for any domain and **automatically upgrades** the placeholder once the
backend has finished discovering the real icon.

## Install

```bash
npm i react-brandicons
# or
bun add react-brandicons
```

React 18 or 19 is required as a peer dependency.

## Usage

```tsx
import { BrandIcon } from "react-brandicons";

<BrandIcon
  domain="github.com"
  apiKey="bri_xxx_xxx_xxxxxxxxxxxxxxxx"
  size="medium"
  placeholder="@image-off"
  loadingPlaceholder="@loader-spin"
  className="h-8 w-8"
/>;
```

## Props

| Prop                 | Type                                                  | Default    | Description                                                                                                                                      |
| -------------------- | ----------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `domain`             | `string`                                              | —          | Domain to fetch the icon for.                                                                                                                    |
| `apiKey`             | `string`                                              | —          | Public, domain-locked BrandIcons API key.                                                                                                        |
| `size`               | `"ico" \| "small" \| "medium" \| "large" \| "vector"` | `"medium"` | Icon size.                                                                                                                                       |
| `placeholder`        | `string`                                              | —          | Shown when the icon is definitively not found. `@name` references built-ins (e.g. `@image-off`); plain names reference your custom placeholders. |
| `loadingPlaceholder` | `string`                                              | —          | Shown while the backend is still searching. Same naming rules as `placeholder`.                                                                  |
| `retry`              | `boolean`                                             | `true`     | Auto-poll and refresh the image when the icon becomes available.                                                                                 |
| any `<img>` prop     | —                                                     | —          | Forwarded to the underlying `<img>` (`className`, `style`, `width`, etc.).                                                                       |

## How retry works

After each image load, the component issues a HEAD request to the same URL and
reads the `x-brandicons-state` header:

- `loading` — backend is still searching. The component schedules a re-render at
  5s, 15s, 45s, 2m, 5m intervals (then stops).
- `provisional` — a fallback icon was served; backend may upgrade it. One retry
  in 5 minutes.
- `not-found` — backend has given up. No more retries.
- (header absent) — real icon is now in S3. No more retries.

HEAD requests share the CloudFront cache key with the GET, so most polls are
served from the edge.

## License

MIT
