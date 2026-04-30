import { paths } from '../lib/router';

export const contactDetails = {
  phone: '+92 300 123 4567',
  email: 'support@traderweb.pk',
  address: 'Hall Road Electronics District, Lahore, Pakistan',
  hours: 'Monday to Saturday, 10:00 AM to 7:00 PM',
};

export const utilityLinks = [
  { label: 'Support', href: paths.support() },
  { label: 'Payment Methods', href: paths.paymentMethods() },
  { label: 'Contact Us', href: paths.contactUs() },
];

export const primaryNav = [
  { label: 'Home', href: paths.home() },
  { label: 'Categories', href: paths.categories() },
  { label: 'About Us', href: paths.aboutUs() },
  { label: 'Support', href: paths.support() },
  { label: 'Contact Us', href: paths.contactUs() },
];

export const categoryFamilies = [
  {
    title: 'Audio & Visual',
    description: 'Displays, HMI panels, speakers, and embedded media components.',
  },
  {
    title: 'Batteries & Chargers',
    description: 'Rechargeable cells, charger modules, battery packs, and adapters.',
  },
  {
    title: 'Beginners Tools & Kits',
    description: 'Starter kits for labs, classrooms, makerspaces, and hobby benches.',
  },
  {
    title: 'Connectivity',
    description: 'Cables, connectors, converters, wireless links, and interface modules.',
  },
  {
    title: 'Consumer Electronics',
    description: 'Ready-to-ship gadgets and practical electronics for everyday use.',
  },
  {
    title: 'Discrete Electronic Components',
    description: 'Capacitors, resistors, diodes, transistors, and related essentials.',
  },
  {
    title: 'Educational & DIYs',
    description: 'Learning modules, STEM kits, and project-friendly development items.',
  },
  {
    title: 'Industrial Electronics',
    description: 'Reliable control, automation, measurement, and power hardware.',
  },
  {
    title: 'Instruments & Tools',
    description: 'Meters, soldering gear, bench tools, and field-testing equipment.',
  },
  {
    title: 'Mechanical',
    description: 'Motors, couplers, fasteners, motion parts, and workshop accessories.',
  },
  {
    title: 'Modules and Breakout Boards',
    description: 'Converter boards, sensor modules, embedded helpers, and adapters.',
  },
  {
    title: 'Robotics & Machines',
    description: 'Actuators, drive systems, wheels, copter parts, and robotics gear.',
  },
  {
    title: 'CNC & 3D Printers',
    description: 'Printers, CNC machines, spares, nozzles, and build accessories.',
  },
  {
    title: 'Environmental',
    description: 'Sensors and monitoring devices for air, temperature, humidity, and more.',
  },
];

export const trustHighlights = [
  {
    title: 'Category-led shopping',
    description: 'Large catalog navigation inspired by electronics marketplace patterns.',
  },
  {
    title: 'Clean support structure',
    description: 'Policies, help, and payment guidance are accessible from every page.',
  },
  {
    title: 'Laravel-backed content',
    description: 'The storefront still uses your public API for live products and stores.',
  },
];

export const footerGroups = [
  {
    title: 'Shop',
    links: [
      { label: 'Home', href: paths.home() },
      { label: 'Categories', href: paths.categories() },
      { label: 'Products', href: paths.products() },
      { label: 'Stores', href: paths.stores() },
    ],
  },
  {
    title: 'Customer Care',
    links: [
      { label: 'Support', href: paths.support() },
      { label: 'Payment Methods', href: paths.paymentMethods() },
      { label: 'Contact Us', href: paths.contactUs() },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: paths.aboutUs() },
      { label: 'Terms and Conditions', href: paths.terms() },
      { label: 'Cookie Policy', href: paths.cookiePolicy() },
    ],
  },
];

export const pageQuickLinks = [
  { label: 'Home', href: paths.home() },
  { label: 'Categories', href: paths.categories() },
  { label: 'Support', href: paths.support() },
  { label: 'Payment Methods', href: paths.paymentMethods() },
  { label: 'About Us', href: paths.aboutUs() },
  { label: 'Contact Us', href: paths.contactUs() },
  { label: 'Terms and Conditions', href: paths.terms() },
  { label: 'Cookie Policy', href: paths.cookiePolicy() },
];

export const termsSections = [
  {
    title: 'Orders and availability',
    body: [
      'Product listings are presented for information and purchasing convenience. Availability may change based on stock position, supplier confirmation, or operational review.',
      'We reserve the right to update pricing, specifications, lead times, and product descriptions when better information becomes available from sellers or manufacturers.',
    ],
    items: [
      'Orders are processed after confirmation of stock and delivery coverage.',
      'Incorrect or incomplete customer details may delay dispatch.',
      'Bulk, custom, or imported items may require additional verification before acceptance.',
    ],
  },
  {
    title: 'Returns and support handling',
    body: [
      'Support requests are handled through the published customer care channels. Resolution time depends on product type, condition reported, and the seller or service partner involved.',
    ],
    items: [
      'Customers should report damaged, missing, or incorrect items as early as possible.',
      'Products showing misuse, tampering, or installation damage may not qualify for replacement or return.',
      'Warranty outcomes depend on the listed warranty terms for each product.',
    ],
  },
  {
    title: 'Use of the website',
    body: [
      'You may not use the storefront to interfere with its services, attempt unauthorized access, or submit misleading order and account information.',
      'We may suspend activity that appears fraudulent, abusive, or operationally unsafe.',
    ],
  },
];

export const supportSections = [
  {
    title: 'How we help',
    body: [
      'The support section is designed around the most common marketplace needs: ordering guidance, payment clarification, product verification, delivery follow-up, and warranty questions.',
    ],
    cards: [
      {
        title: 'Before ordering',
        description: 'Check specifications, stock notes, warranty text, and store details before checkout.',
      },
      {
        title: 'After ordering',
        description: 'Keep your order number ready when asking about dispatch, packing, or delivery updates.',
      },
      {
        title: 'Technical assistance',
        description: 'Share the exact model, issue details, and any setup conditions when asking for help.',
      },
    ],
  },
  {
    title: 'Recommended support flow',
    items: [
      'Review the product page and seller notes first.',
      'Use the support and contact channels for order-specific issues.',
      'Share clear photos or videos when reporting damage or defects.',
      'Wait for confirmation before sending anything back for service or replacement.',
    ],
  },
];

export const paymentSections = [
  {
    title: 'Current storefront guidance',
    body: [
      'This project currently exposes a Laravel commerce flow that is ready for Cash on Delivery. The payment page is structured so additional methods can be presented cleanly as the backend expands.',
    ],
    cards: [
      {
        title: 'Cash on Delivery',
        description: 'Best for local shipments where COD is available and confirmed during checkout.',
      },
      {
        title: 'Bank transfer',
        description: 'Useful for high-value or business orders when manual verification is enabled by operations.',
      },
      {
        title: 'Card and gateway methods',
        description: 'Reserved for future activation when the production payment gateway flow is finalized.',
      },
    ],
  },
  {
    title: 'Payment notes',
    items: [
      'Always confirm the final payable amount before dispatch.',
      'High-value products may require verification before fulfillment.',
      'Gateway refunds, if later enabled, should follow the same order and refund policies defined by operations.',
    ],
  },
];

export const aboutSections = [
  {
    title: 'What this storefront is for',
    body: [
      'TraderWeb is positioned as a modern electronics marketplace with a category-first browsing model, multi-store discovery, and policy pages that are easy to find.',
      'The public experience is intentionally separated from the Laravel admin panel so customer-facing pages can evolve faster without disrupting internal operations.',
    ],
  },
  {
    title: 'Operating principles',
    cards: [
      {
        title: 'Clear catalog structure',
        description: 'Large product ranges should stay easy to scan across categories, stores, and detail pages.',
      },
      {
        title: 'Trust through context',
        description: 'Customers should see payment, support, contact, and legal information without hunting for it.',
      },
      {
        title: 'Scalable integration',
        description: 'The frontend is built around the Laravel API so home, category, and store content remain live.',
      },
    ],
  },
];

export const cookieSections = [
  {
    title: 'Why cookies are used',
    body: [
      'Cookies and similar browser storage help keep sessions stable, remember preferences, and support storefront analytics, security, and experience improvements.',
    ],
    items: [
      'Essential cookies keep the site functioning correctly.',
      'Preference cookies remember browsing and interface choices.',
      'Measurement cookies help identify usage patterns and performance issues.',
    ],
  },
  {
    title: 'Your control',
    body: [
      'You can manage cookies through your browser settings. Disabling essential cookies may affect login persistence, shopping features, or session-based behavior.',
    ],
  },
];
