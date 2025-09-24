import { Node, mergeAttributes } from '@tiptap/core';

export const GapSpacer = Node.create({
  name: 'gapSpacer',
  group: 'block',
  selectable: false,
  atom: true,
  defining: true,
  isolating: true,
  allowGapCursor: true,
  parseHTML() {
    return [
      {
        tag: 'div[data-gap-spacer="true"]',
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        {
          'data-gap-spacer': 'true',
        },
        HTMLAttributes,
      ),
    ];
  },
});
