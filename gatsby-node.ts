import type {
  CreateNodeArgs,
  CreatePagesArgs,
  GatsbyNode,
  CreateResolversArgs,
  Node,
} from 'gatsby';
import * as path from 'path';

export const onCreateNode: GatsbyNode['onCreateNode'] = async ({
  node,
  actions,
}: CreateNodeArgs) => {};

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
  let noteTemplate = path.resolve('src/templates/note.tsx');
  for (let node of nodes) {
    actions.createPage({
      path: node.slug,
      component: noteTemplate,
      context: { id: node.id },
    });
  }
};

/**
 * Parse a link with either '\' or '/' separators and return a normalized
 * route which can be used to match links to pages.
 **/
function link_to_route(link: string): string {
  let parsed = path.parse(link);
  let route = path.join(parsed.dir, parsed.name);
  if (route.startsWith(path.sep)) {
    return route;
  } else {
    return path.join(path.sep, route);
  }
}

const build_backlink_map = async (context: any) => {
  const markdown_link_regex = /\[(.*?)\]\((.*?)\)/g;

  let all_mdx_nodes: { entries: [Node] } = await context.nodeModel.findAll({
    type: `Mdx`,
  });

  let ids_to_backlinks = new Map<string, Set<Node>>();
  let known_routes: Set<string> = new Set(); // the set of all known routes
  let route_to_id: Map<string, string> = new Map(); // a map of routes to node ids
  let id_to_route: Map<string, string> = new Map(); // a map of node ids to routes
  for (let node of all_mdx_nodes.entries) {
    let file_node = context.nodeModel.getNodeById({ id: node.parent });
    if (file_node && file_node.relativePath) {
      let route = link_to_route(file_node.relativePath);
      known_routes.add(route);
      id_to_route.set(node.id, route);
      route_to_id.set(route, node.id);
      ids_to_backlinks[node.id] = new Set();
    }
  }

  for (let node of all_mdx_nodes.entries) {
    let matches = [...node.internal.content.matchAll(markdown_link_regex)];

    for (let match of matches) {
      if (match[2].includes(':')) {
        continue;
      }
      let matched_route = link_to_route(match[2]);
      if (!known_routes.has(matched_route)) {
        throw new Error(
          `Page ${id_to_route.get(
            node.id,
          )} includes a broken link to ${matched_route}`,
        );
      }
      let matched_id = route_to_id.get(matched_route);
      ids_to_backlinks[matched_id].add(node);
    }
  }

  return ids_to_backlinks;
};

export const createResolvers: GatsbyNode['createResolvers'] = ({
  createResolvers,
}: CreateResolversArgs) => {
  let ids_to_backlinks = undefined;
  createResolvers({
    Mdx: {
      backlinks: {
        type: [`Mdx`],
        resolve: async (source, args, context, info) => {
          if (!ids_to_backlinks) {
            ids_to_backlinks = await build_backlink_map(context);
          }
          return ids_to_backlinks[source.id];
        },
      },
    },
  });
};
