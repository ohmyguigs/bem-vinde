import * as React from 'react';
import { PlasmicCanvasHost } from '@plasmicapp/loader-nextjs';
import { PLASMIC } from '@/utils/plasmic-init';

import AwesomeBanner from '@/components/AwesomeBanner';

export default function PlasmicHost() {
  return PLASMIC && <PlasmicCanvasHost />;
}

export function getStaticProps() {
  return {
    props: {},
    // returns the default 404 page with a status code of 404 in production
    notFound: process.env.NODE_ENV === `production`,
  };
}

PLASMIC.registerComponent(AwesomeBanner, {
  name: `AwesomeBanner`,
  props: {
    title: `string`,
    subTitle: `string`,
  },
});
