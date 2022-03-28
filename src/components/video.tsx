import React from 'react';

interface VideoArgs {
  videoSrcURL: string;
  videoTitle: string;
}

export default function Video({
  videoSrcURL,
  videoTitle,
}: VideoArgs): JSX.Element {
  return (
    <div
      className="VideoEmbed"
      style={{
        maxWidth: '100%',
        height: '0',
        margin: '1rem',
        paddingBottom: '56.25%',
        position: 'relative',
      }}
    >
      <iframe
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: '0',
          left: '0',
        }}
        src={videoSrcURL}
        title={videoTitle}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        frameBorder="0"
        allowFullScreen
      />
    </div>
  );
}
