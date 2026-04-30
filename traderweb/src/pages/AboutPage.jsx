import InfoPage from '../components/InfoPage';
import { aboutSections } from '../content/siteContent';

export default function AboutPage({ router }) {
  return (
    <InfoPage
      description="A cleaner public-facing marketplace built around live Laravel catalog APIs, structured trust pages, and a category-first shopping experience."
      eyebrow="Company"
      router={router}
      sections={aboutSections}
      title="About Us"
    />
  );
}
