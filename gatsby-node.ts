import type {
  CreatePagesArgs,
  GatsbyNode,
  CreateResolversArgs,
  Node,
} from 'gatsby';
import * as path from 'path';

/** Convert a slug to a route by prepending a '/' */
function slug_to_route(slug: string): string {
  return '/' + slug;
}

let needs_rebuild: boolean = true;

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
  needs_rebuild = true;
  let nodes: [MdxNode] = result.data.allMdx.nodes;
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

/**
 * Resolve the slug value for a given node.
 **/
const resolve_slug = async (
  node: Node,
  args: any,
  context: any,
  info: any,
): Promise<string> => {
  const type = info.schema.getType('Mdx');
  const resolver = type.getFields()['slug'].resolve;
  return await resolver(node, args, context, info);
};

const markdown_link_regex = /\[(.*?)\]\((.*?)\)/g;

interface Adjacency {
  /**
   * A map of route to node id. e.g. something like
   *   /some/path -> node-23423425
   **/
  known_routes: Map<string, string>;

  /**
   * A map of node id to the set of all node id's it references via links
   * within the note's body.
   **/
  forward_link_map: Map<string, Set<string>>;

  /**
   * A map of node id to the set of all node id's which refer to it within
   * THEIR bodies.
   **/
  back_link_map: Map<string, Set<string>>;
}

const rebuild_maps = async (
  args: any,
  context: any,
  info: any,
): Promise<Adjacency> => {
  let known_routes = new Map<string, string>();
  let forward_link_map = new Map<string, Set<string>>();
  let back_link_map = new Map<string, Set<string>>();

  let result: { entries: [Node] } = await context.nodeModel.findAll({
    type: `Mdx`,
  });
  let nodes = [...result.entries];

  for (let node of nodes) {
    forward_link_map.set(node.id, new Set());
    back_link_map.set(node.id, new Set());
    let slug = await resolve_slug(node, args, context, info);
    known_routes.set(slug_to_route(slug), node.id);
  }

  for (let node of nodes) {
    let matches = [...node.internal.content.matchAll(markdown_link_regex)];
    let slug = await resolve_slug(node, args, context, info);
    console.log(`CHECKING FOR ${slug}`);
    for (let match of matches) {
      let link = match[2];
      if (link.includes(':')) {
        // not an internal link so move along
        continue;
      }
      if (known_routes.has(link)) {
        let linked_id = known_routes.get(link);
        forward_link_map.get(node.id).add(linked_id);
        back_link_map.get(linked_id).add(node.id);
      } else {
        throw new Error(`Page at ${slug} has a broken link to ${link}`);
      }
    }
  }

  return {
    known_routes,
    forward_link_map,
    back_link_map,
  };
};

let adjacency_promise: Promise<Adjacency> = undefined;
const update_maps_if_needed = async (
  args: any,
  context: any,
  info: any,
): Promise<Adjacency> => {
  if (needs_rebuild) {
    adjacency_promise = rebuild_maps(args, context, info);
    needs_rebuild = false;
  }
  return adjacency_promise;
};

export const createResolvers: GatsbyNode['createResolvers'] = ({
  createResolvers,
}: CreateResolversArgs) => {
  createResolvers({
    Mdx: {
      links: {
        type: [`Mdx`],
        resolve: async (source: Node, args: any, context: any, info: any) => {
          const adjacency = await update_maps_if_needed(args, context, info);
          context.nodeModel.findAll({ type: 'Mdx' });
          const linked_node_ids = adjacency.forward_link_map.get(source.id);
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
          const adjacency = await update_maps_if_needed(args, context, info);
          context.nodeModel.findAll({ type: 'Mdx' });
          const linked_node_ids = adjacency.back_link_map.get(source.id);
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
