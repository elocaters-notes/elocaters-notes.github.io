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
import Tippy from '@tippyjs/react';

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

export default function NotePage(context: any) {
  let data: QueryData = context.data;
  const mdx_components = {
    Quote,
    Notice,
    a: ({ href, children }: { href: string; children: JSX.Element[] }) => {
      return (
        <PreviewLink links_on_page={data.mdx.links} href={href}>
          {children}
        </PreviewLink>
      );
    },
  };
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
      </article>
    </Layout>
  );
}
