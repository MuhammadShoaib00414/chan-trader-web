<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Subcategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SubcategorySeeder extends Seeder
{
    public function run(): void
    {
        $partsCategory = Category::where('slug', 'parts')->first();

        if (!$partsCategory) {
            $partsCategory = Category::create([
                'name' => 'Parts',
                'slug' => 'parts',
                'is_active' => true,
            ]);
        }

        $subcategories = [
            'MOSFET', 'IGBT', 'Diode', 'Module', 'Capacitor', 'Bridge', 'Supply', 'Chargers', 
            'Power Lead', 'Tape Lead', 'Flower Cable', 'DC Pin Lead', 'Heatsink', 'Fan', 
            'Welding Machine Terminals', 'Holder', 'Welding Leads', 'Inverter Cards', 
            'Welding Machine Cards', 'Hybrid Inverter Cards', 'UPS Cards', 'UPS Module', 
            'Amplifier Module', 'Voltage Regulator Module', 'Buck/Booster Card', 'UPS Transformers', 
            'China UPS Parts', 'Single Phase Inverter Body', 'Three Phase Inverter Body', 'UPS Body', 
            'Tape Body', 'Supply Body', 'IC', 'Transistor', 'Resistor', 'Regulator', 'Battery', 
            'Rechargeable Cell', 'Connector', 'Lights', 'Module Paste', 'Soldering Wire', 
            'IGBT Paper', 'Switch On/Off', 'Breakers', 'Computer Supply', 'Air Cooler Supply', 
            'Air Cooler DC Pump', 'Water Pump Supply', 'Oven Parts (Megatron)', 'Oven Parts (Capacitor)', 
            'Oven Parts (Fuse)', 'Oven Parts (Rectifier)', 'Oven Parts (Motor)', 
            'Oven Parts (Touch/Button)', 'Oven Parts (Transformer)'
        ];

        // Ensure unique subcategories (Diode was repeated)
        $subcategories = array_unique($subcategories);

        foreach ($subcategories as $subcategory) {
            Subcategory::firstOrCreate(
                [
                    'category_id' => $partsCategory->id,
                    'slug' => Str::slug($subcategory),
                ],
                [
                    'name' => $subcategory,
                    'is_active' => true,
                ]
            );
        }
    }
}
