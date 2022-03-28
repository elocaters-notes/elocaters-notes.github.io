import * as React from 'react';
import * as styles from './note_title.module.css';

interface NoteTitleArgs {
  children: JSX.Element | JSX.Element[] | string;
}

export default function NoteTitle({ children }: NoteTitleArgs): JSX.Element {
  return <span className={styles.title}>{children}</span>;
}
