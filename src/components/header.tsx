import * as React from 'react';
import { useStaticQuery, graphql, Link } from 'gatsby';
import * as headerStyles from './header.module.css';

interface HeaderQuery {
  site: { siteMetadata: { title: string; description: string } };
}

export default function Header(): JSX.Element {
  const data: HeaderQuery = useStaticQuery(graphql`
    query HeaderQuery {
      site {
        siteMetadata {
          title
          description
        }
      }
    }
  `);

  return (
    <header className={headerStyles.header}>
      <h2 className={headerStyles.title}>
        <Link className={headerStyles.link} to="/">
          {data.site.siteMetadata.title}
        </Link>
      </h2>
      <p className={headerStyles.description}>
        {data.site.siteMetadata.description}
      </p>
    </header>
  );
}
