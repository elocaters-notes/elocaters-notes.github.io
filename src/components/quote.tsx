import * as React from 'react';

interface QuoteArgs {
  children: string | JSX.Element | JSX.Element[];
  source: string | JSX.Element;
}

export default function Quote({ children, source }: QuoteArgs): JSX.Element {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          fontStyle: 'italic',
          paddingBottom: '1rem',
        }}
      >
        {children}
      </div>
      <p style={{}}>— {source}</p>
    </div>
  );
}
