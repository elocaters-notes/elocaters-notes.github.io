import * as React from 'react';
import * as styles from './notice.module.css';

interface NoticeArgs {
  title: string;
  children: JSX.Element | JSX.Element[];
}

const Notice = ({ title, children }: NoticeArgs) => {
  return (
    <section className={`${styles.notice}`}>
      <h4>{title}</h4>
      <p>{children}</p>
    </section>
  );
};

export default Notice;
