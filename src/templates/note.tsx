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
      links {
        slug
        frontmatter {
          title
        }
        body
      }
      backlinks {
        slug
        frontmatter {
          title
        }
        excerpt
      }
      frontmatter {
        title
        date(formatString: "LL")
      }
      slug
      body
      excerpt
      timeToRead
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
    timeToRead: number;
    frontmatter: {
      title: string;
      date: string;
    };
    slug: string;
    body: string;
    excerpt: string;
    backlinks: [
      { slug: string; frontmatter: { title: string }; excerpt: string },
    ];
    links: [
      {
        slug: string;
        frontmatter: {
          title: string;
        };
        body: string;
      },
    ];
  };
}

function slug_to_path(slug: string): string {
  return '/' + slug;
}

function mdx_to_node(node: {
  slug: string;
  frontmatter: { title: string };
}): GraphNode {
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
  data.mdx.links.map(mdx_to_node).forEach((node: GraphNode) => {
    node_map.set(node.id, node);
    links.push({
      source: self_id,
      target: node.id,
    });
  });
  data.mdx.backlinks.map(mdx_to_node).forEach((node: GraphNode) => {
    node_map.set(node.id, node);
    links.push({
      source: node.id,
      target: self_id,
    });
  });
  let my_node = mdx_to_node(data.mdx);
  my_node.color = '#cb4b16';
  my_node.radius = 10;
  node_map.set(data.mdx.slug, my_node);
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
          forceStrength={-40}
        ></NetworkGraph>
      </article>
    </Layout>
  );
}
