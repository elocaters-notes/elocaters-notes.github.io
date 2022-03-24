import * as React from 'react';
import * as styles from './backlinks.module.css';
import { Link } from 'gatsby';

interface Backlink {
  frontmatter: {
    title: string;
  };
  excerpt: string;
  slug: string;
}

interface BacklinksArgs {
  backlinks: Backlink[];
}

export default function Backlinks({ backlinks }: BacklinksArgs): JSX.Element {
  if (backlinks.length == 0) {
    return <div id="nobacklinks"></div>;
  }
  return (
    <section>
      <h2>Referenced By</h2>
      <div className={styles.backlinksContainer}>
        {backlinks.map((backlink: Backlink) => {
          return (
            <Link className={styles.backlink} to={'/' + backlink.slug}>
              <h4>{backlink.frontmatter.title}</h4>
              <p>{backlink.excerpt}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
