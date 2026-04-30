import InfoPage from '../components/InfoPage';
import { cookieSections } from '../content/siteContent';

export default function CookiePolicyPage({ router }) {
  return (
    <InfoPage
      description="This page explains how cookies and local browser storage support experience, security, and storefront continuity."
      eyebrow="Privacy"
      router={router}
      sections={cookieSections}
      title="Cookie Policy"
    />
  );
}
