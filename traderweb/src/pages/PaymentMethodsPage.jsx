import InfoPage from '../components/InfoPage';
import { paymentSections } from '../content/siteContent';

export default function PaymentMethodsPage({ router }) {
  return (
    <InfoPage
      description="A clear payment information page keeps expectations aligned while the Laravel commerce flow grows from COD into broader payment coverage."
      eyebrow="Checkout"
      router={router}
      sections={paymentSections}
      title="Payment Methods"
    />
  );
}
