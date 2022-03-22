import * as React from 'react';
import { graphql, Link } from 'gatsby';
import { MDXRenderer } from 'gatsby-plugin-mdx';

interface QueryData {
  mdx: {
    frontmatter: {
      title: string;
    };
    body: string;
    backlinks: [{ slug: string; frontmatter: { title: string } }];
  };
}

const NotePage = (context: any) => {
  let data: QueryData = context.data;
  return (
    <main>
      <h1 id="title">{data.mdx.frontmatter.title}</h1>
      <div id="content">
        <MDXRenderer>{data.mdx.body}</MDXRenderer>
      </div>
      <section id="backlinks">
        <h2>Backlinks</h2>
        {data.mdx.backlinks.map(({ slug, frontmatter: { title } }) => {
          return (
            <div>
              <Link to={'/' + slug}>{title}</Link>
            </div>
          );
        })}
      </section>
    </main>
  );
};

export const query = graphql`
  query MdkNotePoste($id: String) {
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
