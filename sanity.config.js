/**
 * Sanity Studio configuration.
 *
 * The Studio is mounted at /admin on the live site (see src/pages/Studio.jsx)
 * and can also be deployed as a hosted backup at <project>.sanity.studio via
 * `npx sanity deploy`. Both surfaces share this single config.
 *
 * Project ID and dataset are intentionally hardcoded — they are not secrets;
 * Sanity project IDs appear in client-side query URLs.
 */

import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { muxInput } from 'sanity-plugin-mux-input';
import { schemaTypes } from './sanity/schemas';
import { structure } from './sanity/desk/structure';
import DeployTool from './sanity/tools/DeployTool';

const SINGLETON_TYPES = ['siteSettings', 'heroOverlay', 'showreel', 'heroPhotos'];

export default defineConfig({
  name: 'baba-portfolio',
  title: 'Basile Deschamps — Portfolio',
  projectId: 'e9pgmdfm',
  dataset: 'production',
  basePath: '/admin',
  plugins: [
    structureTool({ structure }),
    visionTool(),
    // Mux video input: drag-and-drop uploads from Studio, automatic 720p
    // transcoding + adaptive bitrate (HLS). Token ID + secret are stored
    // server-side in Sanity's secrets API (set via `npx sanity secrets`),
    // NOT in the public Studio bundle.
    muxInput({
      max_resolution_tier: '1080p',
      encoding_tier: 'smart',
      mp4_support: 'none',
    }),
  ],
  // Custom tools appear as tabs in the Studio's left sidebar. The Deploy
  // tool is a manual replacement for the Sanity → Vercel auto-webhook —
  // gives one-click control over when production rebuilds.
  tools: (prev) => [
    ...prev,
    {
      name: 'deploy',
      title: 'Deploy',
      icon: () => '🚀',
      component: DeployTool,
    },
  ],
  schema: {
    types: schemaTypes,
  },
  document: {
    // Hide destructive actions on singleton documents so Basile cannot delete
    // or duplicate them by accident.
    actions: (prev, { schemaType }) => {
      if (SINGLETON_TYPES.includes(schemaType)) {
        return prev.filter(
          ({ action }) => !['unpublish', 'delete', 'duplicate'].includes(action),
        );
      }
      return prev;
    },
    // Hide singletons from the "Create new" menu — they're created via the
    // structure tree instead.
    newDocumentOptions: (prev, { creationContext }) => {
      if (creationContext.type === 'global') {
        return prev.filter((tpl) => !SINGLETON_TYPES.includes(tpl.templateId));
      }
      return prev;
    },
  },
});
