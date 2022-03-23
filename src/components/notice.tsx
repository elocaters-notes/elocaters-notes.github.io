import * as React from 'react';
import { MDXRenderer } from 'gatsby-plugin-mdx';

const Notice = ({ title, type, children }: any) => {
  let color = 'blue';
  switch (type) {
    case 'info':
      color = 'blue';
      break;
    case 'danger':
      color = 'red';
      break;
    default:
      color = 'blue';
      break;
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'left',
        backgroundColor: color,
      }}
    >
      <h4>{title}</h4>
      <p>{children}</p>
    </div>
  );
};

export default Notice;
