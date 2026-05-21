import { defineType, defineField } from 'sanity';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  groups: [
    { name: 'identity', title: 'Identity', default: true },
    { name: 'seo', title: 'SEO' },
    { name: 'social', title: 'Social' },
    { name: 'nav', title: 'Navigation' },
    { name: 'display', title: 'Display' },
    { name: 'footer', title: 'Footer' },
  ],
  fields: [
    // -------------------- Identity --------------------
    defineField({
      name: 'artistName',
      title: 'Artist full name',
      type: 'string',
      group: 'identity',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'artistFirstName',
      title: 'Artist first name',
      type: 'string',
      group: 'identity',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'artistLastName',
      title: 'Artist last name',
      type: 'string',
      group: 'identity',
      validation: (Rule) => Rule.required(),
    }),

    // -------------------- SEO --------------------
    defineField({
      name: 'seoTitle',
      title: 'Browser title (SEO)',
      type: 'string',
      group: 'seo',
      validation: (Rule) => Rule.required().max(70),
    }),
    defineField({
      name: 'seoDescription',
      title: 'Meta description (SEO)',
      type: 'text',
      rows: 3,
      group: 'seo',
      validation: (Rule) => Rule.required().max(160),
    }),
    defineField({
      name: 'seoKeywords',
      title: 'Keywords',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      group: 'seo',
    }),
    defineField({
      name: 'ogImage',
      title: 'Social share image (Open Graph)',
      description: 'Shown when the site URL is shared on social media.',
      type: 'image',
      options: { hotspot: true },
      group: 'seo',
    }),
    defineField({
      name: 'siteUrl',
      title: 'Production URL',
      type: 'url',
      group: 'seo',
      validation: (Rule) => Rule.required(),
    }),

    // -------------------- Social --------------------
    defineField({
      name: 'socialInstagram',
      title: 'Instagram URL',
      type: 'url',
      group: 'social',
    }),
    defineField({
      name: 'socialVimeo',
      title: 'Vimeo URL',
      type: 'url',
      group: 'social',
    }),
    defineField({
      name: 'socialLinkedin',
      title: 'LinkedIn URL',
      type: 'url',
      group: 'social',
    }),
    defineField({
      name: 'socialTwitter',
      title: 'Twitter / X URL',
      type: 'url',
      group: 'social',
    }),
    defineField({
      name: 'socialBehance',
      title: 'Behance URL',
      type: 'url',
      group: 'social',
    }),

    // -------------------- Navigation --------------------
    defineField({
      name: 'navActiveStyle',
      title: 'Active nav link style',
      description: 'How the link for the current page is highlighted.',
      type: 'string',
      options: {
        list: [
          { title: 'Pill (boxed highlight)', value: 'pill' },
          { title: 'Bold + larger', value: 'bold-larger' },
        ],
        layout: 'radio',
      },
      initialValue: 'bold-larger',
      group: 'nav',
    }),
    defineField({
      name: 'navLinkSize',
      title: 'Nav link size (px)',
      description: 'Font size for inactive nav links.',
      type: 'number',
      initialValue: 16,
      validation: (Rule) => Rule.positive().integer(),
      group: 'nav',
    }),
    defineField({
      name: 'navLinkActiveSize',
      title: 'Nav active link size (px)',
      description:
        'Font size for the active nav link. Bigger than the base size gives the "bold + larger" emphasis; equal removes the size delta.',
      type: 'number',
      initialValue: 18,
      validation: (Rule) => Rule.positive().integer(),
      group: 'nav',
    }),

    // -------------------- Display --------------------
    defineField({
      name: 'featuredTitleHoverEffect',
      title: 'Title hover effect',
      description:
        'How a featured film or photo section title reacts on hover. "Highlight" gives it a black background with white text. "Grow" enlarges it and makes it bolder, like the active navigation link.',
      type: 'string',
      options: {
        list: [
          { title: 'Highlight (black background)', value: 'invert' },
          { title: 'Grow (bigger + bolder)', value: 'grow' },
        ],
        layout: 'radio',
      },
      initialValue: 'invert',
      group: 'display',
    }),
    defineField({
      name: 'featuredTitleHoverWholeSection',
      title: 'Highlight title when hovering the whole section',
      description:
        'On the featured film and photo sections: when ON, hovering anywhere on a section highlights its title. When OFF, the title only highlights when the pointer is on the title text itself.',
      type: 'boolean',
      initialValue: true,
      group: 'display',
    }),

    // -------------------- Footer --------------------
    defineField({
      name: 'footerCopyright',
      title: 'Copyright text',
      description: 'Current year is automatically prepended at render time.',
      type: 'string',
      group: 'footer',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'footerShowSocial',
      title: 'Show social links in footer',
      type: 'boolean',
      initialValue: true,
      group: 'footer',
    }),
  ],
  preview: {
    select: { title: 'artistName' },
    prepare: ({ title }) => ({ title: title || 'Site settings' }),
  },
});
