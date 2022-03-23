import * as React from 'react';
import Layout from './layout';
import { graphql, Link } from 'gatsby';
import { MDXProvider } from '@mdx-js/react';
import { MDXRenderer } from 'gatsby-plugin-mdx';
import Notice from '../components/notice';
import { Helmet } from 'react-helmet';
import * as noteStyles from './note.module.css';

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
    backlinks: [{ slug: string; frontmatter: { title: string } }];
  };
}

const shortcodes = { Notice };

const NotePage = (context: any) => {
  let data: QueryData = context.data;
  return (
    <Layout>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{data.mdx.frontmatter.title}</title>
      </Helmet>
      <article className={noteStyles.main}>
        <h1 className={noteStyles.title}>{data.mdx.frontmatter.title}</h1>

        <section className={noteStyles.metadataHeader}>
          <p>{data.mdx.timeToRead} min read</p>
          <p>{data.mdx.frontmatter.date}</p>
        </section>

        <section>
          <MDXProvider components={shortcodes}>
            <MDXRenderer>{data.mdx.body}</MDXRenderer>
          </MDXProvider>
        </section>

        {data.mdx.backlinks.length > 0 && (
          <section>
            <h2>Referenced By</h2>
            <ul>
              {data.mdx.backlinks.map(({ slug, frontmatter: { title } }) => {
                return (
                  <li>
                    <Link to={'/' + slug}>{title}</Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </article>
    </Layout>
  );
};

export const query = graphql`
  query MdxNotePost($id: String) {
    site {
      siteMetadata {
        title
        description
      }
    }
    mdx(id: { eq: $id }) {
      backlinks {
        slug
        frontmatter {
          title
        }
      }
      frontmatter {
        title
        date(formatString: "LL")
      }
      body
      timeToRead
    }
  }
`;

export default NotePage;
