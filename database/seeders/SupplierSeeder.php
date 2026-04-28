<?php

namespace Database\Seeders;

use App\Models\Store;
use App\Models\Supplier;
use App\Models\SupplierPayment;
use App\Models\SupplierTransaction;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        // Get the default store
        $store = Store::first();

        if (!$store) {
            $this->command->error('No store found. Please run other seeders first.');
            return;
        }

        // Sample supplier data
        $suppliers = [
            [
                'name' => 'ABC Electronics',
                'email' => 'contact@abcelectronics.com',
                'phone' => '+92-300-1234567',
                'address' => 'Shahrah-e-Faisal, Karachi',
                'category' => Supplier::CATEGORY_LOCAL,
            ],
            [
                'name' => 'Global Tech Imports',
                'email' => 'info@globaltech.pk',
                'phone' => '+92-321-7654321',
                'address' => 'DHA Phase 5, Lahore',
                'category' => Supplier::CATEGORY_IMPORTED,
            ],
            [
                'name' => 'Metro Wholesale',
                'email' => 'sales@metrowholesale.com',
                'phone' => '+92-333-9876543',
                'address' => 'Gulberg, Lahore',
                'category' => Supplier::CATEGORY_WHOLESALE,
            ],
            [
                'name' => 'Tech Solutions Ltd',
                'email' => 'support@techsolutions.pk',
                'phone' => '+92-302-4567890',
                'address' => 'Blue Area, Islamabad',
                'category' => Supplier::CATEGORY_LOCAL,
            ],
            [
                'name' => 'International Components',
                'email' => 'orders@intcomponents.com',
                'phone' => '+92-315-2345678',
                'address' => 'PECHS, Karachi',
                'category' => Supplier::CATEGORY_IMPORTED,
            ],
            [
                'name' => 'Prime Distributors',
                'email' => 'contact@primedist.com',
                'phone' => '+92-300-8765432',
                'address' => 'Johar Town, Lahore',
                'category' => Supplier::CATEGORY_WHOLESALE,
            ],
            [
                'name' => 'Digital Parts Hub',
                'email' => 'info@digitalpartshub.pk',
                'phone' => '+92-322-3456789',
                'address' => 'F-10, Islamabad',
                'category' => Supplier::CATEGORY_LOCAL,
            ],
            [
                'name' => 'Asia Pacific Traders',
                'email' => 'sales@asiapacific.pk',
                'phone' => '+92-301-5678901',
                'address' => 'Saddar, Rawalpindi',
                'category' => Supplier::CATEGORY_IMPORTED,
            ],
            [
                'name' => 'Bulk Electronics Supply',
                'email' => 'orders@bulkelectronics.com',
                'phone' => '+92-313-6789012',
                'address' => 'Model Town, Lahore',
                'category' => Supplier::CATEGORY_WHOLESALE,
            ],
            [
                'name' => 'Component Masters',
                'email' => 'support@componentmasters.pk',
                'phone' => '+92-300-7890123',
                'address' => 'Clifton, Karachi',
                'category' => Supplier::CATEGORY_LOCAL,
            ],
        ];

        foreach ($suppliers as $supplierData) {
            $supplier = Supplier::create($supplierData);

            // Associate with the store
            $supplier->stores()->attach($store->id);

            // Create 1-3 transactions per supplier
            $transactionCount = rand(1, 3);

            for ($i = 0; $i < $transactionCount; $i++) {
                $this->createTransactionForSupplier($supplier, $store);
            }

            $this->command->info("Created supplier: {$supplier->name} with {$transactionCount} transactions");
        }

        $this->command->info('Supplier seeding completed successfully!');
    }

    private function createTransactionForSupplier(Supplier $supplier, Store $store): void
    {
        // Random goods value between 50,000 and 500,000 PKR
        $goodsValue = rand(50000, 500000);

        // Add markup (10-30%)
        $markupPercentage = rand(10, 30) / 100;
        $totalPayable = round($goodsValue * (1 + $markupPercentage), 2);

        // Random payment duration (1 or 2 months)
        $paymentDuration = rand(1, 2);

        // Calculate installments
        $totalInstallments = $paymentDuration * 4; // 4 weeks per month
        $installmentAmount = round($totalPayable / $totalInstallments, 2);

        // Create transaction
        $transaction = SupplierTransaction::create([
            'supplier_id' => $supplier->id,
            'store_id' => $store->id,
            'goods_value' => $goodsValue,
            'total_payable' => $totalPayable,
            'payment_duration' => $paymentDuration,
            'installment_amount' => $installmentAmount,
            'total_installments' => $totalInstallments,
            'paid_installments' => 0,
            'status' => 'active',
        ]);

        // Create some payments (randomly 0 to all installments paid)
        $paidInstallments = rand(0, $totalInstallments);
        $transaction->paid_installments = $paidInstallments;

        if ($paidInstallments > 0) {
            $this->createPaymentsForTransaction($transaction, $paidInstallments);
        }

        $transaction->save();
    }

    private function createPaymentsForTransaction(SupplierTransaction $transaction, int $paidInstallments): void
    {
        $createdAt = $transaction->created_at;

        for ($i = 1; $i <= $paidInstallments; $i++) {
            // Calculate payment date (weekly intervals)
            $paymentDate = $createdAt->copy()->addWeeks($i);

            // For the last payment, use remaining balance
            $amount = ($i === $paidInstallments && $i < $transaction->total_installments)
                ? $transaction->remaining_balance
                : $transaction->installment_amount;

            SupplierPayment::create([
                'supplier_transaction_id' => $transaction->id,
                'amount' => $amount,
                'paid_at' => $paymentDate,
                'installment_number' => $i,
            ]);
        }
    }
}