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

/**
 * An instance of this type can be constructed by crawling the GatsbyJS
 * Node API.
 **/
interface AdjacencyGraph {
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

/**
 * Maintains an up-to-date version of the AdjacencyGraph. The graph can be
 * invalidated on demand to be reconstructed when used with `npm run develop`.
 **/
class ReplaceableGraph {
  invalid: boolean = true;
  adjacency_promise: Promise<AdjacencyGraph> = undefined;

  /**
   * Invalidate the graph to be rebuilt the next time it's requested by a
   * resolver.
   **/
  invalidate() {
    this.invalid = true;
  }

  /**
   * Get the current AdjacencyGraph, or rebuild the graph if the current one
   * is out of date.
   * Arguments are a direct passthrough from the values passed to `resolve`.
   **/
  async getCurrentGraph(
    args: any,
    context: any,
    info: any,
  ): Promise<AdjacencyGraph> {
    if (this.invalid) {
      this.adjacency_promise = this._rebuild_maps(args, context, info);
      this.invalid = false;
    }
    return this.adjacency_promise;
  }

  /**
   * Resolve the slug value for a given node.
   **/
  async _resolve_slug(
    node: Node,
    args: any,
    context: any,
    info: any,
  ): Promise<string> {
    const type = info.schema.getType('Mdx');
    const resolver = type.getFields()['slug'].resolve;
    return await resolver(node, args, context, info);
  }

  /**
   * Asynchronously rebuild the AdjacencyGraph by scanning all of the mdx nodes.
   **/
  async _rebuild_maps(
    args: any,
    context: any,
    info: any,
  ): Promise<AdjacencyGraph> {
    const markdown_link_regex = /\[(.*?)\]\((.*?)\)/g;
    const known_routes = new Map<string, string>();
    const forward_link_map = new Map<string, Set<string>>();
    const back_link_map = new Map<string, Set<string>>();

    const result: { entries: [Node] } = await context.nodeModel.findAll({
      type: `Mdx`,
    });
    const nodes = [...result.entries];

    for (const node of nodes) {
      forward_link_map.set(node.id, new Set());
      back_link_map.set(node.id, new Set());
      const slug = await this._resolve_slug(node, args, context, info);
      known_routes.set(slug_to_route(slug), node.id);
    }

    for (const node of nodes) {
      const matches = [...node.internal.content.matchAll(markdown_link_regex)];
      const slug = await this._resolve_slug(node, args, context, info);
      console.log(`CHECKING FOR ${slug}`);
      for (const match of matches) {
        const link = match[2];
        if (link.includes(':')) {
          // not an internal link so move along
          continue;
        }
        if (known_routes.has(link)) {
          const linked_id = known_routes.get(link);
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
  }
}

const graph = new ReplaceableGraph();

export const createPages: GatsbyNode['createPages'] = async ({
  graphql,
  actions,
}: CreatePagesArgs) => {
  graph.invalidate();
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
          const adjacency = await graph.getCurrentGraph(args, context, info);
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
          const adjacency = await graph.getCurrentGraph(args, context, info);
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
