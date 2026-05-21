<?php

namespace App\Enums;

enum ContentPageSlug: string
{
    case AboutUs = 'about-us';
    case TermsAndConditions = 'terms-and-conditions';
    case PrivacyPolicy = 'privacy-policy';
    case ShippingPolicy = 'shipping-policy';
    case ReturnRefundPolicy = 'return-refund-policy';
    case Faq = 'faq';

    public function defaultTitle(): string
    {
        return match ($this) {
            self::AboutUs => 'About Us',
            self::TermsAndConditions => 'Terms & Conditions',
            self::PrivacyPolicy => 'Privacy Policy',
            self::ShippingPolicy => 'Shipping Policy',
            self::ReturnRefundPolicy => 'Return & Refund Policy',
            self::Faq => 'FAQ',
        };
    }

    /**
     * @return list<self>
     */
    public static function all(): array
    {
        return self::cases();
    }
}
