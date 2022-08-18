import Head from 'next/head';
import {
  PlasmicRootProvider,
  PlasmicComponent,
  ComponentRenderData,
  extractPlasmicQueryData,
} from '@plasmicapp/loader-nextjs';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import AwesomeBanner from '@/components/AwesomeBanner';
import { PLASMIC } from '@/utils/plasmic-init';

// Statically fetch the data needed to render Plasmic pages or components.
export const getStaticProps = async () => {
  // You can pass in multiple page paths or component names.
  const plasmicData = await PLASMIC.fetchComponentData(`Home`, `AwesomeBanner`);
  if (!plasmicData) {
    throw new Error(`No Plasmic design found`);
  }

  // Cache the necessary data fetched for the page
  const queryCache = await extractPlasmicQueryData(
    <PlasmicRootProvider loader={PLASMIC} prefetchedData={plasmicData}>
      <PlasmicComponent component={plasmicData.entryCompMetas[0].displayName} />
    </PlasmicRootProvider>,
  );
  return {
    props: {
      plasmicData,
      queryCache,
      // ...
    },

    // Using incremental static regeneration, will invalidate this page
    // after 300s (no deploy webhooks needed)
    revalidate: 300,
  };
};

export default function Home(props: {
  plasmicData: ComponentRenderData;
  queryCache?: Record<string, any>;
}) {
  return (
    <>
      <Head>
        <title>TypeScript starter for Next.js</title>
        <meta
          name="description"
          content="TypeScript starter for Next.js that includes all you need to build amazing apps"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Box sx={{ width: `100%` }}>
        <PlasmicRootProvider
          loader={PLASMIC}
          prefetchedData={props.plasmicData}
          prefetchedQueryData={props.queryCache}
        >
          <PlasmicComponent component="Home" />
        </PlasmicRootProvider>
        <AwesomeBanner
          title="Hello World"
          subTitle="This is a simple example of a Plasmic component"
        />
      </Box>
    </>
  );
}
