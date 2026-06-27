<?php

namespace Database\Seeders;

use App\Models\Slider;
use Illuminate\Database\Seeder;

class SliderSeeder extends Seeder
{
    public function run(): void
    {
        // Professional, high-resolution industrial / electrical imagery (Unsplash CDN,
        // 2000px wide, dark-toned to sit well under the hero's gradient + white text).
        $sliders = [
            [
                'title'       => 'Premium Electrical Components',
                'subtitle'    => 'Quality inverters, motors, welding machines and industrial parts trusted by professionals across Pakistan.',
                'button_text' => 'Shop Now',
                'button_url'  => '/products',
                'image'       => 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2000&q=80',
                'display_order' => 1,
            ],
            [
                'title'       => 'Industrial Parts & Tools',
                'subtitle'    => 'Complete range of industrial components, breakers, tools and electrical fittings at the best prices.',
                'button_text' => 'Browse Products',
                'button_url'  => '/products',
                'image'       => 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=2000&q=80',
                'display_order' => 2,
            ],
            [
                'title'       => 'Special Deals Available',
                'subtitle'    => 'Shop our latest arrivals and best-selling products. New stock added every week.',
                'button_text' => 'View Deals',
                'button_url'  => '/products',
                'image'       => 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=2000&q=80',
                'display_order' => 3,
            ],
            [
                'title'       => 'Welding Machines & Motors',
                'subtitle'    => 'Heavy-duty welding equipment and electric motors for every industrial application.',
                'button_text' => 'Shop Motors',
                'button_url'  => '/products?category=motor',
                'image'       => 'https://images.unsplash.com/photo-1565043666747-69f6646db940?auto=format&fit=crop&w=2000&q=80',
                'display_order' => 4,
            ],
            [
                'title'       => 'Circuit Breakers & Safety Gear',
                'subtitle'    => 'Protect your installations with certified breakers and electrical safety equipment.',
                'button_text' => 'Explore Breakers',
                'button_url'  => '/products?category=breaker',
                'image'       => 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=2000&q=80',
                'display_order' => 5,
            ],
        ];

        foreach ($sliders as $data) {
            Slider::updateOrCreate(
                ['title' => $data['title']],
                array_merge($data, ['is_active' => true])
            );
        }

        $this->command?->info('Seeded ' . count($sliders) . ' sliders.');
    }
}
