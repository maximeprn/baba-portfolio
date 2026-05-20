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

export const heroOverlay = defineType({
  name: 'heroOverlay',
  title: 'Hero overlay',
  type: 'document',
  description:
    'Floating text items rendered on top of the hero video (Films page) and hero photo slideshow (Photos page).',
  fields: [
    defineField({
      name: 'items',
      title: 'Overlay items',
      description: 'Reorder by dragging. Each item is positioned independently.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'heroOverlayItem',
          fields: [
            defineField({
              name: 'text',
              title: 'Text',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'anchor',
              title: 'Anchor point',
              description:
                'Which corner / edge of the hero this item is positioned from. On phones, only the vertical part is used: Top and Middle items go into the top group (below the menu), Bottom items into the bottom group.',
              type: 'string',
              options: { list: ANCHOR_OPTIONS },
              initialValue: 'top-left',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'offsetX',
              title: 'Offset X (px)',
              description:
                'Distance inward from the anchor side, horizontally. Desktop only — on phones the text is positioned automatically.',
              type: 'number',
              initialValue: 32,
            }),
            defineField({
              name: 'offsetY',
              title: 'Offset Y (px)',
              description:
                'Distance inward from the anchor side, vertically. Desktop only — on phones the text is positioned automatically.',
              type: 'number',
              initialValue: 32,
            }),
            defineField({
              name: 'size',
              title: 'Text style',
              description:
                'Body = normal paragraph text. Contact = uppercase with wide letter-spacing (for phone / email). This sets the styling only — use “Text size” below to change how big it is.',
              type: 'string',
              options: {
                list: [
                  { title: 'Body (bio / paragraph)', value: 'body' },
                  { title: 'Contact (uppercase, tracked)', value: 'contact' },
                ],
                layout: 'radio',
              },
              initialValue: 'body',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'textSize',
              title: 'Text size',
              description:
                'How big the text is. On phones it scales down automatically — and shrinks a little more if needed so it always fits without touching the menu or other overlay text.',
              type: 'string',
              options: {
                list: [
                  { title: 'Extra small', value: 'xs' },
                  { title: 'Small', value: 'sm' },
                  { title: 'Medium', value: 'md' },
                  { title: 'Large', value: 'lg' },
                  { title: 'Extra large', value: 'xl' },
                ],
                layout: 'radio',
              },
              initialValue: 'md',
            }),
            defineField({
              name: 'link',
              title: 'Make this text a link',
              type: 'object',
              fields: [
                defineField({
                  name: 'type',
                  title: 'Link type',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'None (plain text)', value: 'none' },
                      { title: 'Email (mailto:)', value: 'email' },
                      { title: 'Phone (tel:)', value: 'phone' },
                      { title: 'External URL', value: 'url' },
                    ],
                    layout: 'dropdown',
                  },
                  initialValue: 'none',
                }),
                defineField({
                  name: 'value',
                  title: 'Link target',
                  description:
                    'Email address, phone number, or full URL — depending on link type.',
                  type: 'string',
                  hidden: ({ parent }) => !parent?.type || parent.type === 'none',
                }),
              ],
            }),
            defineField({
              name: 'mobileVisible',
              title: 'Show on mobile (< 768px)',
              description:
                'On phones, items are arranged automatically into a safe top and bottom area. Untick this to hide an item from phones entirely.',
              type: 'boolean',
              initialValue: true,
            }),
            defineField({
              name: 'stackWithSiblings',
              title: 'Stack with adjacent siblings',
              description:
                'Desktop only. Adjacent items with this toggle on AND the same anchor are stacked vertically into one column. The FIRST flagged item in the chain determines where the column sits (its offsets); later items inherit that position. A non-flagged item or a change of anchor breaks the chain.',
              type: 'boolean',
              initialValue: false,
            }),
            defineField({
              name: 'stackRowGap',
              title: 'Stack row gap (px)',
              description:
                'Desktop only. When this item is the FIRST in a stack: vertical space between rows once items wrap. Defaults to 24px so the gap stays bigger than line-height. Ignored on items that are not the first in their stack.',
              type: 'number',
              initialValue: 24,
              validation: (Rule) => Rule.min(0).integer(),
              hidden: ({ parent }) => !parent?.stackWithSiblings,
            }),
            defineField({
              name: 'maxWidth',
              title: 'Max width (px)',
              description:
                'Cap the item’s width so long text wraps instead of running off the screen. Leave blank for no cap. Try 600 for full-sentence text like the bio or client list.',
              type: 'number',
              validation: (Rule) => Rule.positive().integer(),
            }),
          ],
          preview: {
            select: {
              text: 'text',
              anchor: 'anchor',
              size: 'size',
              textSize: 'textSize',
              stack: 'stackWithSiblings',
            },
            prepare: ({ text, anchor, size, textSize, stack }) => ({
              title: text,
              subtitle: `${anchor} · ${size}${textSize ? ` · ${textSize}` : ''}${
                stack ? ' · stacks' : ''
              }`,
            }),
          },
        }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Hero overlay' }),
  },
});
