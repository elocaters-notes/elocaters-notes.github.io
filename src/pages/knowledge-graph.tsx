import * as React from 'react';
import { graphql, useStaticQuery } from 'gatsby';
import { Helmet } from 'react-helmet';
import {
  GraphLink,
  GraphNode,
  NetworkGraph,
} from '../components/network_graph';
import Layout from '../templates/layout';

export interface KnowledgeGraphProps {}

interface MdxGraphNode {
  slug: string;
  frontmatter: {
    title: string;
  };
}

interface MdxRootNode extends MdxGraphNode {
  links: MdxGraphNode[];
}

interface FullNodeGraph {
  allMdx: {
    nodes: MdxRootNode[];
  };
}

function slug_to_path(slug: string): string {
  return '/' + slug;
}

function mdx_to_node(node: MdxGraphNode): GraphNode {
  return {
    id: slug_to_path(node.slug),
    title: node.frontmatter.title,
  };
}

function shared_prefix_len(id_a: string, id_b: string): number {
  let shared_prefix = 0;
  let max = Math.min(id_a.length, id_b.length);
  for (let i = 0; i < max && id_a[i] == id_b[i]; i++, shared_prefix = i) {}
  return shared_prefix;
}

function KnowledgeGraph(props: KnowledgeGraphProps): JSX.Element {
  const data = useStaticQuery(graphql`
    query FullNodeGraph {
      allMdx {
        nodes {
          links {
            ...MdxGraphNode
          }
          ...MdxGraphNode
        }
      }
    }
    fragment MdxGraphNode on Mdx {
      slug
      frontmatter {
        title
      }
    }
  `) as FullNodeGraph;

  const links: GraphLink[] = [];
  const node_map = new Map<string, GraphNode>();
  data.allMdx.nodes.forEach((root: MdxRootNode) => {
    let root_id = slug_to_path(root.slug);
    if (root_id == '/404') {
      return;
    }
    node_map.set(root_id, mdx_to_node(root));
    root.links.forEach((link_node: MdxGraphNode) => {
      let target_id = slug_to_path(link_node.slug);
      let len = shared_prefix_len(root_id, target_id);
      links.push({
        source: root_id,
        target: target_id,
        length: len > 1 ? 50 : 100,
        strengthMultiplier: len > 1 ? 1.5 : 0.1,
        opacity: len > 1 ? 1.0 : 0.25,
        lineWidth: len > 1 ? 1.1 : 0.9,
      });
    });
  });
  const nodes = [...node_map.values()];

  return (
    <Layout>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Full Knowledge Graph</title>
        <meta property="og:title" content="Full Knowledge Graph" />
        <meta property="og:type" content="website" />
        <meta
          property="og:description"
          content="The complete knowledge graph for all of Elocater's Notes."
        />
      </Helmet>

      <NetworkGraph
        nodes={nodes}
        links={links}
        forceStrength={-100}
        collisionDistance={15}
      ></NetworkGraph>
    </Layout>
  );
}

export default KnowledgeGraph;
