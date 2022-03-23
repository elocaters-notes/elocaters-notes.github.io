import * as React from 'react';
import Layout from './layout';
import { graphql, Link } from 'gatsby';
import { MDXProvider } from '@mdx-js/react';
import { MDXRenderer } from 'gatsby-plugin-mdx';
import Notice from '../components/notice';
import * as noteStyles from './note.module.css';

interface QueryData {
  site: {
    siteMetadata: {
      title: string;
      description: string;
    };
  };
  mdx: {
    frontmatter: {
      title: string;
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
      <article className={noteStyles.main_note}>
        <h1 id="title" style={{ fontStyle: 'italic' }}>
          {data.mdx.frontmatter.title}
        </h1>

        <section>
          <p>Read time</p>
          <p>Tags:</p>
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
      }
      body
    }
  }
`;

export default NotePage;
