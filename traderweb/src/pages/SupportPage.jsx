import InfoPage from '../components/InfoPage';
import { supportSections } from '../content/siteContent';

export default function SupportPage({ router }) {
  return (
    <InfoPage
      description="Support is organized around ordering help, delivery follow-up, technical clarification, and seller-side issue resolution."
      eyebrow="Customer Care"
      router={router}
      sections={supportSections}
      title="Support"
    />
  );
}
