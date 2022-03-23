import type {
  CreatePagesArgs,
  GatsbyNode,
  CreateResolversArgs,
  Node,
} from 'gatsby';
import * as path from 'path';

const markdown_link_regex = /\[(.*?)\]\((.*?)\)/g;

/** Convert a slug to a route by prepending a '/' */
function slug_to_route(slug: string): string {
  return '/' + slug;
}

/**
 * A map of routes to their corresponding Node ids.
 */
let known_routes = new Map<string, string>();

/**
 * A global adjacency map of MDX node ids which link to other MDX node ids.
 * e.g. there is a [link like this](/with/some/internal/page) in the body.
 *
 * This is automatically rebuilt on each call to `createPages`.
 */
let forward_link_map = new Map<string, Set<string>>();

/**
 * A global adjacency map of MDX node ids wihch link back to the given node.
 * e.g. another page has a []() link which refers to this current one.
 *
 * This is automatically rebuilt on each call to `createPages`.
 */
let back_link_map = new Map<string, Set<string>>();

export const createPages: GatsbyNode['createPages'] = async ({
  graphql,
  actions,
}: CreatePagesArgs) => {
  interface MdxNode {
    rawBody: string;
    id: string;
    slug: string;
    frontmatter: {
      title: string;
    };
  }
  const result: any = await graphql(`
    query {
      allMdx {
        nodes {
          rawBody
          id
          slug
          frontmatter {
            title
          }
        }
      }
    }
  `);
  let nodes: [MdxNode] = result.data.allMdx.nodes;
  known_routes.clear();
  forward_link_map.clear();
  back_link_map.clear();
  nodes.forEach((node: MdxNode) => {
    forward_link_map.set(node.id, new Set());
    back_link_map.set(node.id, new Set());
    known_routes.set(slug_to_route(node.slug), node.id);
  });
  nodes.forEach((node: MdxNode) => {
    let matches = [...node.rawBody.matchAll(markdown_link_regex)];
    matches.forEach((match: RegExpMatchArray) => {
      let link = match[2];
      if (link.includes(':')) {
        // not an internal link so move along
        return;
      }
      if (known_routes.has(link)) {
        let linked_id = known_routes.get(link);
        forward_link_map.get(node.id).add(linked_id);
        back_link_map.get(linked_id).add(node.id);
      } else {
        throw new Error(`Page at ${node.slug} has a broken link to ${link}`);
      }
    });
  });

  let noteTemplate = path.resolve('src/templates/note.tsx');
  for (let node of nodes) {
    console.log(`CREATING PAGE ${node.slug}`);
    actions.createPage({
      path: slug_to_route(node.slug),
      component: noteTemplate,
      context: { id: node.id },
    });
  }
};

export const createResolvers: GatsbyNode['createResolvers'] = ({
  createResolvers,
}: CreateResolversArgs) => {
  createResolvers({
    Mdx: {
      links: {
        type: [`Mdx`],
        resolve: async (source: Node, args: any, context: any, info: any) => {
          context.nodeModel.findAll({ type: 'Mdx' });
          let linked_node_ids = forward_link_map.get(source.id);
          let linked_nodes = [];
          linked_node_ids.forEach((id) => {
            let node = context.nodeModel.getNodeById({ id });
            linked_nodes.push(node);
          });
          return linked_nodes;
        },
      },
      backlinks: {
        type: [`Mdx`],
        resolve: async (source: Node, args: any, context: any, info: any) => {
          context.nodeModel.findAll({ type: 'Mdx' });
          let linked_node_ids = back_link_map.get(source.id);
          let linked_nodes = [];
          linked_node_ids.forEach((id) => {
            let node = context.nodeModel.getNodeById({ id });
            linked_nodes.push(node);
          });
          return linked_nodes;
        },
      },
    },
  });
};
