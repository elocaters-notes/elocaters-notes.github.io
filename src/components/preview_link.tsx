import * as React from 'react';
import Tippy from '@tippyjs/react';
import { Link } from 'gatsby';
import { MDXProvider } from '@mdx-js/react';
import { MDXRenderer } from 'gatsby-plugin-mdx';
import NoteTitle from './note_title';

import './preview_link.css';
import 'tippy.js/dist/tippy.css';

interface LinkData {
  slug: string;
  frontmatter: {
    title: string;
  };
  body: string;
}

interface PreviewLinkArgs {
  links_on_page: LinkData[];
  href: string;
  children: JSX.Element | JSX.Element[];
}

export default function PreviewLink({
  links_on_page,
  href,
  children,
}: PreviewLinkArgs): JSX.Element {
  let link_data = undefined;
  if (links_on_page) {
    link_data = links_on_page.find((link_data) => href == `/` + link_data.slug);
  }

  if (link_data) {
    return (
      <Tippy
        theme="notes_theme"
        interactive={true}
        interactiveBorder={20}
        delay={100}
        content={
          <article>
            <h2>
              <Link
                to={href}
                style={{ textDecoration: 'none', color: 'var(--em-text)' }}
              >
                <NoteTitle>{link_data.frontmatter.title}</NoteTitle>
              </Link>
            </h2>
            <MDXProvider components={{ a: Link }}>
              <MDXRenderer>{link_data.body}</MDXRenderer>
            </MDXProvider>
          </article>
        }
      >
        <Link to={href}>{children}</Link>
      </Tippy>
    );
  } else {
    return (
      <a href={href} target="_blank">
        {children}
      </a>
    );
  }
}
