import InfoPage from '../components/InfoPage';
import { termsSections } from '../content/siteContent';

export default function TermsPage({ router }) {
  return (
    <InfoPage
      description="These terms describe how marketplace orders, support expectations, and acceptable website use should be handled on the customer-facing storefront."
      eyebrow="Legal"
      router={router}
      sections={termsSections}
      title="Terms and Conditions"
    />
  );
}
