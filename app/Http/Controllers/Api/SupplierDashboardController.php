<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\AppBaseController;
use App\Models\SupplierTransaction;
use Carbon\Carbon;

class SupplierDashboardController extends AppBaseController
{
    public function index()
    {
        $now = Carbon::now()->startOfDay();
        $currentWeekStart = $now->copy()->startOfWeek();
        $currentWeekEnd = $now->copy()->endOfWeek();
        $nextWeekStart = $currentWeekStart->copy()->addWeek();
        $nextWeekEnd = $currentWeekEnd->copy()->addWeek();
        $transactions = SupplierTransaction::with(['supplier:id,name', 'payments:supplier_transaction_id,amount'])
            ->where('status', 'active')
            ->latest()
            ->get();

        $suppliersWithOutstanding = $transactions
            ->filter(fn (SupplierTransaction $transaction) => $transaction->remaining_balance > 0)
            ->groupBy('supplier.name')
            ->map(function ($group, $supplierName) {
                return [
                    'name' => $supplierName,
                    'outstanding_balance' => round($group->sum(fn (SupplierTransaction $transaction) => $transaction->remaining_balance), 2),
                ];
            })
            ->sortByDesc('outstanding_balance')
            ->values();

        $upcomingPayments = $transactions
            ->map(function (SupplierTransaction $transaction) use ($currentWeekEnd, $currentWeekStart, $nextWeekEnd, $nextWeekStart) {
                $nextDue = $transaction->next_installment_due;

                if (! $nextDue) {
                    return null;
                }

                $dueDate = $nextDue->copy()->startOfDay();
                $weekLabel = $dueDate->lt($currentWeekStart)
                    ? 'Overdue'
                    : ($dueDate->lte($currentWeekEnd)
                        ? 'This Week'
                        : ($dueDate->between($nextWeekStart, $nextWeekEnd)
                            ? 'Next Week'
                            : 'Week '.($currentWeekStart->diffInWeeks($dueDate->copy()->startOfWeek()) + 1)));

                return [
                    'supplier_name' => $transaction->supplier->name,
                    'amount' => $transaction->next_installment_amount,
                    'due_date' => $dueDate->toDateString(),
                    'week_label' => $weekLabel,
                    'is_highlighted' => in_array($weekLabel, ['Overdue', 'This Week', 'Next Week'], true),
                ];
            })
            ->filter()
            ->sortBy('due_date')
            ->values();

        $outstandingBalances = $suppliersWithOutstanding
            ->map(fn (array $item) => [
                'supplier' => $item['name'],
                'balance' => $item['outstanding_balance'],
            ])
            ->values();

        $paymentProgress = $transactions->map(function (SupplierTransaction $transaction) {
            return [
                'supplier' => $transaction->supplier->name,
                'progress' => $transaction->progress_percentage,
                'paid' => $transaction->paid_installments,
                'total' => $transaction->total_installments,
            ];
        })->values();

        return $this->successResponse([
            'suppliers_with_outstanding' => $suppliersWithOutstanding,
            'upcoming_payments' => $upcomingPayments,
            'charts' => [
                'outstanding_balances' => $outstandingBalances,
                'payment_progress' => $paymentProgress,
            ],
        ], 'Dashboard data retrieved successfully');
    }
}
