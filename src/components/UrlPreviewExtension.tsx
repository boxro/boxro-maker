import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import UrlPreview from './UrlPreview';

export interface UrlPreviewOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    urlPreview: {
      setUrlPreview: (url: string) => ReturnType;
    };
  }
}

export const UrlPreviewExtension = Node.create<UrlPreviewOptions>({
  name: 'urlPreview',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      url: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-url-preview]',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          return {
            url: element.getAttribute('data-url'),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        { 'data-url-preview': 'true' },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(({ node, deleteNode }) => (
      <UrlPreview
        url={node.attrs.url}
        onRemove={deleteNode}
      />
    ));
  },

  addCommands() {
    return {
      setUrlPreview:
        (url: string) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              url,
            },
          });
        },
    };
  },
});
