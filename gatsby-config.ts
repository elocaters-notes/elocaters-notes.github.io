import type { GatsbyConfig } from 'gatsby';

const config: GatsbyConfig = {
  siteMetadata: {
    title: `Elocater's Notes`,
    siteUrl: `https://elocaters-notes.github.io`,
    description: `A Digital Garden of Elocater's RP thoughts.`,
  },
  plugins: [
    'gatsby-plugin-catch-links',
    'gatsby-plugin-react-helmet',
    'gatsby-plugin-sass',
    'gatsby-plugin-image',
    'gatsby-plugin-sharp',
    'gatsby-transformer-sharp',
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'images',
        path: `./src/images/`,
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'pages',
        path: `./src/pages/`,
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'notes',
        path: `./notes/`,
      },
    },
    {
      resolve: 'gatsby-plugin-mdx',
      options: {
        extensions: [`.mdx`, `.md`],
      },
    },
    {
      resolve: 'gatsby-plugin-manifest',
      options: {
        icon: 'src/images/gatsby-icon.png',
        short_name: "Elo's Notes",
        name: "Elocater's Notes",
      },
    },
  ],
};

export default config;
