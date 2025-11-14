# Deployment Configuration

## Vercel Project Settings

**Project Name**: `source-4-industries`
**Team**: `taylors-projects-9942914c` (Taylor's projects)

**Production URL**: https://source-4-industries.vercel.app

### Root Directory Configuration
The Vercel project is configured with:
- **Root Directory**: `Source 4 Dashboard/web`
- **Framework**: Next.js (auto-detected)

### Important Files
- `vercel.json` - Contains `installCommand` override for `--legacy-peer-deps`
- `next.config.ts` - Disables ESLint/TypeScript build errors
- `.vercel/` - Local project link (gitignored, will recreate on each machine)

## Initial Setup on New Machine

When working from a new machine or after cloning:

```bash
cd "Source 4 Dashboard/web"
vercel link --project source-4-industries --yes
```

This will create the `.vercel` folder locally and link to the correct project.

## Build Configuration

### vercel.json
```json
{
  "installCommand": "npm install --legacy-peer-deps"
}
```

### next.config.ts
```typescript
{
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true }
}
```

## Monitoring Deployments

Check deployment status:
```bash
cd "Source 4 Dashboard/web"
vercel ls
```

Inspect latest deployment:
```bash
vercel inspect <deployment-url>
```

Get build logs:
```bash
vercel inspect <deployment-url> --logs
```

## Common Issues

### Issue: "Could not read package.json"
**Cause**: Root Directory not set in Vercel dashboard
**Fix**: Set Root Directory to `Source 4 Dashboard/web` in Vercel project settings

### Issue: ESLint errors blocking build
**Cause**: Strict linting in production build
**Fix**: Already configured in `next.config.ts` with `ignoreDuringBuilds: true`

### Issue: Peer dependency conflicts
**Cause**: React 19 RC conflicting with stable dependencies
**Fix**: Already configured in `vercel.json` with `--legacy-peer-deps`
