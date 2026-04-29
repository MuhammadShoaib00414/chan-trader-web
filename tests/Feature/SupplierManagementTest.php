<?php

use App\Models\Supplier;
use App\Models\SupplierPayment;
use App\Models\SupplierTransaction;
use App\Models\Store;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

function actingAsSupplierAdmin(): User
{
    test()->seed(RolesAndPermissionsSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));

    test()->actingAs($admin);

    return $admin;
}

it('creates suppliers and weekly installment transactions from the web module', function () {
    $admin = actingAsSupplierAdmin();

    $store = Store::create([
        'owner_id' => $admin->id,
        'name' => 'Central Shop',
        'slug' => 'central-shop',
        'status' => 'active',
    ]);

    $supplierResponse = $this->post('/admin/suppliers', [
        'name' => 'Alpha Metals',
        'email' => 'alpha@example.com',
        'phone' => '03001234567',
        'address' => 'Main Market',
        'category' => 'local',
        'store_ids' => [$store->id],
    ]);

    $supplierResponse->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.name', 'Alpha Metals')
        ->assertJsonPath('data.category', 'local')
        ->assertJsonPath('data.stores.0.name', 'Central Shop');

    $supplierId = (int) $supplierResponse->json('data.id');

    $transactionResponse = $this->post('/admin/supplier-transactions', [
        'supplier_id' => $supplierId,
        'store_id' => $store->id,
        'goods_value' => 100000,
        'total_payable' => 100000,
        'payment_duration' => 2,
    ]);

    $transactionResponse->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.total_installments', 8)
        ->assertJsonPath('data.installment_amount', '12500.00')
        ->assertJsonPath('data.status', 'active')
        ->assertJsonPath('data.store.name', 'Central Shop');

    $transaction = SupplierTransaction::with('payments')->findOrFail((int) $transactionResponse->json('data.id'));

    expect($transaction->remaining_balance)->toBe(100000.0);
    expect($transaction->next_installment_amount)->toBe(12500.0);
});

it('records supplier payments and closes the schedule on the adjusted final installment', function () {
    actingAsSupplierAdmin();

    $supplier = Supplier::create([
        'name' => 'Beta Cables',
        'email' => 'beta@example.com',
        'phone' => '03111222333',
        'category' => 'wholesale',
    ]);

    $transaction = SupplierTransaction::create([
        'supplier_id' => $supplier->id,
        'goods_value' => 100000.01,
        'total_payable' => 100000.01,
        'payment_duration' => 1,
        'installment_amount' => 25000.00,
        'total_installments' => 4,
        'paid_installments' => 0,
        'status' => 'active',
    ]);

    foreach ([25000.00, 25000.00, 25000.00, 25000.01] as $index => $amount) {
        $response = $this->post('/admin/supplier-payments', [
            'supplier_transaction_id' => $transaction->id,
            'amount' => $amount,
            'paid_at' => now()->addDays($index)->toDateString(),
        ]);

        $response->assertCreated()->assertJsonPath('success', true);
    }

    $transaction->refresh()->load('payments');

    expect($transaction->paid_installments)->toBe(4);
    expect($transaction->status)->toBe('completed');
    expect($transaction->remaining_balance)->toBe(0.0);
    expect($transaction->next_installment_amount)->toBe(0.0);

    $this->assertDatabaseHas('supplier_payments', [
        'supplier_transaction_id' => $transaction->id,
        'installment_number' => 4,
        'amount' => 25000.01,
    ]);

    expect(SupplierPayment::where('supplier_transaction_id', $transaction->id)->count())->toBe(4);
});

it('renders the supplier dashboard with outstanding balances and highlighted current week dues', function () {
    actingAsSupplierAdmin();

    $supplier = Supplier::create([
        'name' => 'Gamma Tools',
        'email' => 'gamma@example.com',
        'category' => 'imported',
    ]);

    $transaction = SupplierTransaction::create([
        'supplier_id' => $supplier->id,
        'goods_value' => 100000,
        'total_payable' => 100000,
        'payment_duration' => 2,
        'installment_amount' => 12500,
        'total_installments' => 8,
        'paid_installments' => 0,
        'status' => 'active',
    ]);

    $transaction->forceFill([
        'created_at' => now()->subWeek(),
        'updated_at' => now()->subWeek(),
    ])->save();

    $this->get('/admin/supplier-dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/suppliers/dashboard')
            ->where('suppliersWithOutstanding.0.name', 'Gamma Tools')
            ->where('suppliersWithOutstanding.0.outstanding_balance', 100000)
            ->where('upcomingPayments.0.supplier_name', 'Gamma Tools')
            ->where('upcomingPayments.0.week_label', 'This Week')
            ->where('upcomingPayments.0.is_highlighted', true)
            ->where('charts.paymentProgress.0.progress', 0)
        );
});

it('filters suppliers and shows a supplier ledger with store assignments', function () {
    $admin = actingAsSupplierAdmin();

    $storeA = Store::create([
        'owner_id' => $admin->id,
        'name' => 'North Branch',
        'slug' => 'north-branch',
        'status' => 'active',
    ]);

    $storeB = Store::create([
        'owner_id' => $admin->id,
        'name' => 'South Branch',
        'slug' => 'south-branch',
        'status' => 'active',
    ]);

    $alpha = Supplier::create([
        'name' => 'Alpha Electric',
        'email' => 'alpha@ledger.test',
        'category' => 'local',
    ]);
    $alpha->stores()->sync([$storeA->id, $storeB->id]);

    $beta = Supplier::create([
        'name' => 'Beta Importers',
        'email' => 'beta@ledger.test',
        'category' => 'imported',
    ]);
    $beta->stores()->sync([$storeB->id]);

    $transaction = SupplierTransaction::create([
        'supplier_id' => $alpha->id,
        'store_id' => $storeA->id,
        'goods_value' => 80000,
        'total_payable' => 80000,
        'payment_duration' => 1,
        'installment_amount' => 20000,
        'total_installments' => 4,
        'paid_installments' => 1,
        'status' => 'active',
    ]);

    SupplierPayment::create([
        'supplier_transaction_id' => $transaction->id,
        'amount' => 20000,
        'paid_at' => now(),
        'installment_number' => 1,
    ]);

    $this->get("/admin/suppliers?q=Alpha&category=local&store_id={$storeA->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/suppliers/index')
            ->where('suppliers', fn ($suppliers) => count($suppliers) === 1 && $suppliers[0]['name'] === 'Alpha Electric')
        );

    $this->get("/admin/suppliers/{$alpha->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/suppliers/show')
            ->where('supplier.name', 'Alpha Electric')
            ->where('supplier.category', 'local')
            ->where('supplier.stores', fn ($stores) => count($stores) === 2)
            ->where('summary.transactions_count', 1)
            ->where('summary.total_paid', 20000)
            ->where('summary.outstanding_balance', 60000)
            ->where('transactions.0.store.name', 'North Branch')
            ->where('payments.0.transaction.store.name', 'North Branch')
        );
});
