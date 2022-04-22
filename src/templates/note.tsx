import * as React from 'react';
import Layout from './layout';
import { graphql } from 'gatsby';
import { MDXProvider } from '@mdx-js/react';
import { MDXRenderer } from 'gatsby-plugin-mdx';
import Notice from '../components/notice';
import { Helmet } from 'react-helmet';
import Backlinks from '../components/backlinks';
import PreviewLink from '../components/preview_link';
import NoteTitle from '../components/note_title';
import Quote from '../components/quote';
import Video from '../components/video';
import {
  NetworkGraph,
  GraphNode,
  GraphLink,
} from '../components/network_graph';

import * as noteStyles from './note.module.css';
import 'tippy.js/dist/tippy.css';

export const query = graphql`
  query MdxNotePost($id: String) {
    site {
      siteMetadata {
        title
        description
      }
    }
    mdx(id: { eq: $id }) {
      ...MdxGraphNode

      links {
        ...MdxGraphNode
        body
        links {
          ...MdxGraphNode
        }
        backlinks {
          ...MdxGraphNode
        }
      }
      backlinks {
        ...MdxGraphNode
        excerpt
        links {
          ...MdxGraphNode
        }
        backlinks {
          ...MdxGraphNode
        }
      }
      frontmatter {
        date(formatString: "LL")
      }
      body
      excerpt
      timeToRead
    }
  }
  fragment MdxGraphNode on Mdx {
    slug
    frontmatter {
      title
    }
  }
`;

interface QueryData {
  site: {
    siteMetadata: {
      title: string;
      description: string;
    };
  };
  mdx: {
    links: {
      slug: string;
      frontmatter: { title: string };
      body: string;
      links: {
        slug: string;
        frontmatter: { title: string };
      }[];
      backlinks: {
        slug: string;
        frontmatter: { title: string };
      }[];
    }[];
    backlinks: {
      slug: string;
      frontmatter: { title: string };
      excerpt: string;
      links: {
        slug: string;
        frontmatter: { title: string };
      }[];
      backlinks: {
        slug: string;
        frontmatter: { title: string };
      }[];
    }[];
    frontmatter: {
      date: string;
      title: string;
    };
    slug: string;
    body: string;
    excerpt: string;
    timeToRead: number;
  };
}

/** The minimum set of info needed to render an MDX graph node. */
interface MdxGraphNode {
  slug: string;
  frontmatter: { title: string };
}

/**
 * The set of info describing an MDX graph node that's only 'one hop' from the
 * current page.
 */
interface OneHopMdxGraphNode extends MdxGraphNode {
  links: MdxGraphNode[];
  backlinks: MdxGraphNode[];
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

export default function NotePage(context: any) {
  const data: QueryData = context.data;
  const mdx_components = {
    Quote,
    Notice,
    Video,
    a: ({ href, children }: { href: string; children: JSX.Element[] }) => {
      return (
        <PreviewLink links_on_page={data.mdx.links} href={href}>
          {children}
        </PreviewLink>
      );
    },
  };

  const self_id = slug_to_path(data.mdx.slug);
  const links: GraphLink[] = [];
  const node_map = new Map<string, GraphNode>();
  data.mdx.links.forEach((node_one_hop_mdx) => {
    let node_one_hop = mdx_to_node(node_one_hop_mdx);
    node_map.set(node_one_hop.id, node_one_hop);
    links.push({
      source: self_id,
      target: node_one_hop.id,
      lineWidth: 2.0,
      length: 100,
    });
    node_one_hop_mdx.links.forEach(
      (node_two_hop_mdx: { slug: string; frontmatter: { title: string } }) => {
        let node_two_hop = mdx_to_node(node_two_hop_mdx);
        node_map.set(node_two_hop.id, node_two_hop);
        links.push({
          source: node_one_hop.id,
          target: node_two_hop.id,
          length: 100,
          strengthMultiplier: 0.2,
          opacity: 0.25,
        });
      },
    );
    node_one_hop_mdx.backlinks.forEach(
      (node_two_hop_mdx: { slug: string; frontmatter: { title: string } }) => {
        let node_two_hop = mdx_to_node(node_two_hop_mdx);
        node_map.set(node_two_hop.id, node_two_hop);
        links.push({
          source: node_two_hop.id,
          target: node_one_hop.id,
          strengthMultiplier: 0.2,
          opacity: 0.25,
          length: 100,
        });
      },
    );
  });
  data.mdx.backlinks.forEach((node_one_hop_mdx) => {
    let node_one_hop = mdx_to_node(node_one_hop_mdx);
    node_map.set(node_one_hop.id, node_one_hop);
    links.push({
      source: node_one_hop.id,
      target: self_id,
      length: 100,
      lineWidth: 2.0,
    });
    node_one_hop_mdx.links.forEach(
      (node_two_hop_mdx: { slug: string; frontmatter: { title: string } }) => {
        let node_two_hop = mdx_to_node(node_two_hop_mdx);
        node_map.set(node_two_hop.id, node_two_hop);
        links.push({
          source: node_one_hop.id,
          target: node_two_hop.id,
          length: 100,
          strengthMultiplier: 0.2,
          opacity: 0.25,
        });
      },
    );
    node_one_hop_mdx.backlinks.forEach(
      (node_two_hop_mdx: { slug: string; frontmatter: { title: string } }) => {
        let node_two_hop = mdx_to_node(node_two_hop_mdx);
        node_map.set(node_two_hop.id, node_two_hop);
        links.push({
          source: node_two_hop.id,
          target: node_one_hop.id,
          strengthMultiplier: 0.2,
          opacity: 0.25,
          length: 100,
        });
      },
    );
  });
  let my_node = mdx_to_node(data.mdx);
  my_node.color = '#cb4b16';
  my_node.radius = 10;
  node_map.set(my_node.id, my_node);
  const nodes = [...node_map.values()];

  return (
    <Layout>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{data.mdx.frontmatter.title}</title>
        <meta property="og:title" content={data.mdx.frontmatter.title} />
        <meta property="og:type" content="website" />
        <meta property="og:description" content={data.mdx.excerpt} />
      </Helmet>
      <article className={noteStyles.main}>
        <h1 style={{ marginBottom: '0rem' }}>
          <NoteTitle>{data.mdx.frontmatter.title}</NoteTitle>
        </h1>

        <section className={noteStyles.metadataHeader}>
          <p>{data.mdx.timeToRead} min read</p>
          <p>{data.mdx.frontmatter.date}</p>
        </section>

        <section>
          <MDXProvider components={mdx_components}>
            <MDXRenderer>{data.mdx.body}</MDXRenderer>
          </MDXProvider>
        </section>

        <Backlinks backlinks={data.mdx.backlinks}></Backlinks>

        <h2>Links Visualized</h2>
        <NetworkGraph
          links={links}
          nodes={nodes}
          forceStrength={-500}
          collisionDistance={30}
        ></NetworkGraph>
      </article>
    </Layout>
  );
}
