import AppLink from '../components/AppLink';
import EmptyState from '../components/EmptyState';
import { paths } from '../lib/router';

export default function NotFoundPage({ router }) {
  return (
    <EmptyState
      title="Page not found"
      description="The requested route is not part of the standalone TraderWeb storefront."
      action={
        <AppLink
          className="inline-flex rounded-full bg-[#ff3a3d] px-5 py-3 text-sm font-semibold text-white"
          router={router}
          to={paths.home()}
        >
          Return home
        </AppLink>
      }
    />
  );
}
