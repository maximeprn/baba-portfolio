import { defineType, defineField, defineArrayMember } from 'sanity';

// Left / right only — overlay text is never centered (by design), so the
// center anchors are deliberately omitted from the picker.
const ANCHOR_OPTIONS = [
  { title: 'Top · Left', value: 'top-left' },
  { title: 'Top · Right', value: 'top-right' },
  { title: 'Middle · Left', value: 'middle-left' },
  { title: 'Middle · Right', value: 'middle-right' },
  { title: 'Bottom · Left', value: 'bottom-left' },
  { title: 'Bottom · Right', value: 'bottom-right' },
];

// Shared named text-size scale. Reused for the computer size + the optional
// per-screen phone / tablet sizes.
const SIZE_OPTIONS = [
  { title: 'Extra small', value: 'xs' },
  { title: 'Small', value: 'sm' },
  { title: 'Medium', value: 'md' },
  { title: 'Large', value: 'lg' },
  { title: 'Extra large', value: 'xl' },
];

// True when this item lets smaller screens size themselves automatically.
// Missing value (older items) counts as "on".
const isAutoShrink = ({ parent }) => parent?.autoShrinkSmallScreens !== false;

export const heroOverlay = defineType({
  name: 'heroOverlay',
  title: 'Hero overlay',
  type: 'document',
  fields: [
    defineField({
      name: 'items',
      title: 'Overlay items',
      // NOTE: keep the guidance here — document-level descriptions are not
      // rendered by Studio v4's form view, field descriptions are.
      description:
        'The floating text on top of the hero — the bio, the client list and the contact details. Drag to reorder.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'heroOverlayItem',
          fieldsets: [
            {
              name: 'advanced',
              title: 'Advanced options',
              options: { collapsible: true, collapsed: true },
            },
          ],
          fields: [
            // --- Basics --------------------------------------------------
            defineField({
              name: 'text',
              title: 'Text',
              description: 'What this text says.',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'anchor',
              title: 'Position',
              description:
                'Which corner of the screen this text sits in. On phones, top items group near the top, bottom items near the bottom.',
              type: 'string',
              options: { list: ANCHOR_OPTIONS },
              initialValue: 'top-left',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'size',
              title: 'Style',
              description:
                'Normal paragraph text, or contact style — CAPITALS with wide spacing, made for phone numbers and emails.',
              type: 'string',
              options: {
                list: [
                  { title: 'Normal text', value: 'body' },
                  { title: 'Contact (capitals, spaced out)', value: 'contact' },
                ],
                layout: 'radio',
              },
              initialValue: 'body',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'textSize',
              title: 'Size',
              description:
                'How big the text is on a computer. Phones and tablets shrink it to match — see the setting just below.',
              type: 'string',
              options: { list: SIZE_OPTIONS, layout: 'radio' },
              initialValue: 'md',
            }),
            defineField({
              name: 'autoShrinkSmallScreens',
              title: 'Shrink automatically on phone & tablet',
              description:
                'Leave this on and the text resizes itself for smaller screens. Turn it off to choose the phone and tablet sizes yourself.',
              type: 'boolean',
              initialValue: true,
            }),
            defineField({
              name: 'phoneSize',
              title: 'Phone size',
              description: 'How big this text is on phones.',
              type: 'string',
              options: { list: SIZE_OPTIONS, layout: 'radio' },
              initialValue: 'sm',
              hidden: isAutoShrink,
            }),
            defineField({
              name: 'tabletSize',
              title: 'Tablet size',
              description: 'How big this text is on tablets.',
              type: 'string',
              options: { list: SIZE_OPTIONS, layout: 'radio' },
              initialValue: 'md',
              hidden: isAutoShrink,
            }),
            // --- Advanced ------------------------------------------------
            defineField({
              name: 'link',
              title: 'Make it a link',
              description:
                'Turn this text into something clickable — an email, a phone number, or a website.',
              type: 'object',
              fieldset: 'advanced',
              fields: [
                defineField({
                  name: 'type',
                  title: 'Opens',
                  description: 'What happens when someone taps this text.',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Nothing — just text', value: 'none' },
                      { title: 'An email', value: 'email' },
                      { title: 'A phone call', value: 'phone' },
                      { title: 'A website', value: 'url' },
                    ],
                    layout: 'dropdown',
                  },
                  initialValue: 'none',
                }),
                defineField({
                  name: 'value',
                  title: 'Goes to',
                  description: 'The email address, phone number, or web address.',
                  type: 'string',
                  hidden: ({ parent }) => !parent?.type || parent.type === 'none',
                }),
              ],
            }),
            defineField({
              name: 'maxWidth',
              title: 'Maximum width',
              description:
                'Stops long text from stretching too wide on large screens. Leave empty for no limit.',
              type: 'number',
              fieldset: 'advanced',
              validation: (Rule) => Rule.positive().integer(),
            }),
            defineField({
              name: 'stackWithSiblings',
              title: 'Group with the text above',
              description:
                'Keeps this text attached to the one directly above it, so they move together as one block.',
              type: 'boolean',
              fieldset: 'advanced',
              initialValue: false,
            }),
            defineField({
              name: 'mobileVisible',
              title: 'Show on phones',
              description: 'Uncheck to hide this text on phones only.',
              type: 'boolean',
              fieldset: 'advanced',
              initialValue: true,
            }),
            // --- Retired fields ------------------------------------------
            // Positions and gaps are now fixed in code (see doc 14). These
            // are kept hidden only so older documents don't show "unknown
            // field" warnings in Studio. The renderer ignores them.
            defineField({ name: 'offsetX', type: 'number', hidden: true }),
            defineField({ name: 'offsetY', type: 'number', hidden: true }),
            defineField({ name: 'stackRowGap', type: 'number', hidden: true }),
          ],
          preview: {
            select: {
              text: 'text',
              anchor: 'anchor',
              size: 'size',
              textSize: 'textSize',
              stack: 'stackWithSiblings',
            },
            prepare: ({ text, anchor, size, textSize, stack }) => {
              // Speak the same language as the input labels — raw values like
              // "top-left · body · md" mean nothing to a non-technical editor.
              const anchorLabel =
                ANCHOR_OPTIONS.find((o) => o.value === anchor)?.title ?? anchor;
              const styleLabel = size === 'contact' ? 'Contact' : 'Normal';
              const sizeLabel = SIZE_OPTIONS.find((o) => o.value === textSize)?.title;
              return {
                title: text,
                subtitle: [anchorLabel, styleLabel, sizeLabel, stack ? 'grouped' : null]
                  .filter(Boolean)
                  .join(' · '),
              };
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Hero overlay' }),
  },
});
