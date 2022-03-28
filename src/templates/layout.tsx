import * as React from 'react';
import { useStaticQuery, graphql } from 'gatsby';
import Header from '../components/header';

import './layout.css';

interface LayoutProps {
  children: JSX.Element | JSX.Element[];
}

/**
 * Layout for every page in the site.
 **/
export default function Layout({ children }: LayoutProps): JSX.Element {
  return (
    <main className="ElocatersNotesMainLayout-light">
      <Header></Header>
      {children}
    </main>
  );
}
