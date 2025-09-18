// contentlayer.config.ts
import { defineDocumentType, makeSource } from "contentlayer/source-files";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import { s } from "hastscript";
var Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: `**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    date: { type: "date", required: true },
    excerpt: {
      type: "string",
      required: true
    },
    tags: {
      type: "list",
      of: { type: "string" },
      required: true
    },
    cover: {
      type: "string",
      required: false
    }
  },
  computedFields: {
    url: {
      type: "string",
      resolve: (post) => `/blog/${post._raw.flattenedPath}`
    },
    readTime: {
      type: "string",
      resolve: (post) => {
        const wordsPerMinute = 200;
        const noOfWords = post.body.raw.split(/\s/g).length;
        const minutes = noOfWords / wordsPerMinute;
        const readTime = Math.ceil(minutes);
        return readTime;
      }
    }
  }
}));
var contentlayer_config_default = makeSource({
  // folder in which we will store our content mdx files
  contentDirPath: "posts",
  documentTypes: [Post],
  mdx: {
    rehypePlugins: [
      /**
       * Adds ids to headings
       */
      rehypeSlug,
      [
        /**
         * Adds auto-linking button after h1, h2, h3 headings
         */
        rehypeAutolinkHeadings,
        {
          behavior: "append",
          test: ["h2", "h3"],
          properties: { class: "heading-link" },
          content: s(
            "svg",
            {
              xmlns: "http://www.w3.org/2000/svg",
              viewBox: "0 0 24 24",
              width: "24",
              height: "24",
              fill: "none",
              stroke: "currentColor",
              "stroke-width": "2",
              "stroke-linecap": "round",
              "stroke-linejoin": "round",
              "aria-label": "Anchor link"
            },
            [
              s("line", { x1: "4", y1: "9", x2: "20", y2: "9" }),
              s("line", { x1: "4", y1: "15", x2: "20", y2: "15" }),
              s("line", { x1: "10", y1: "3", x2: "8", y2: "21" }),
              s("line", { x1: "16", y1: "3", x2: "14", y2: "21" })
            ]
          )
        }
      ],
      [
        /**
         * Enhances code blocks with syntax highlighting, line numbers,
         * titles, and allows highlighting specific lines and words
         */
        rehypePrettyCode,
        {
          theme: {
            light: "github-light",
            dark: "github-dark"
          },
          keepBackground: false,
          onVisitLine(node) {
            if (node.children.length === 0) {
              node.children = [{ type: "text", value: " " }];
            }
          },
          onVisitHighlightedLine(node) {
            node.properties.className.push("highlighted");
          },
          onVisitHighlightedWord(node) {
            node.properties.className = ["word--highlighted"];
          }
        }
      ]
    ]
  }
});
export {
  Post,
  contentlayer_config_default as default
};
//# sourceMappingURL=compiled-contentlayer-config-OYM6HRUE.mjs.map
