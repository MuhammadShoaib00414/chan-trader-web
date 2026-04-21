<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\AppBaseController;
use App\Models\SearchSuggestion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * @group APP APIs
 */
class SuggestionsController extends AppBaseController
{
    /**
     * Save Search Suggestion
     *
     * Save a search query for future suggestions.
     *
     * @authenticated
     * @bodyParam query string required The search query to save. Example: capacitor
     *
     * @response 200 {
     *   "success": true,
     *   "message": "Search suggestion saved",
     *   "data": {
     *     "id": 1,
     *     "query": "capacitor",
     *     "created_at": "2026-04-21T10:30:00.000000Z"
     *   }
     * }
     */
    public function store(Request $request)
    {
        $request->validate([
            'query' => ['required', 'string', 'min:1', 'max:255'],
        ]);

        $query = trim($request->input('query'));
        
        // Don't save empty or very short queries
        if (strlen($query) < 2) {
            return $this->errorResponse('Query too short', 422);
        }

        // Check if this user already has this query recently (avoid duplicates)
        $existingSuggestion = SearchSuggestion::where('user_id', auth()->id())
            ->where('query', $query)
            ->where('created_at', '>', now()->subDays(7))
            ->first();

        if ($existingSuggestion) {
            // Update the existing suggestion's timestamp to refresh it
            $existingSuggestion->touch();
            return $this->successResponse([
                'id' => $existingSuggestion->id,
                'query' => $existingSuggestion->query,
                'created_at' => $existingSuggestion->created_at,
            ], 'Search suggestion updated');
        }

        // Create new suggestion
        $suggestion = SearchSuggestion::create([
            'user_id' => auth()->id(),
            'query' => $query,
        ]);

        return $this->successResponse([
            'id' => $suggestion->id,
            'query' => $suggestion->query,
            'created_at' => $suggestion->created_at,
        ], 'Search suggestion saved');
    }

    /**
     * Get Search Suggestions
     *
     * Get the user's search suggestions, ordered by most recent.
     *
     * @authenticated
     * @queryParam limit integer Maximum number of suggestions to return. Example: 10
     *
     * @response 200 {
     *   "success": true,
     *   "message": "Suggestions retrieved",
     *   "data": [
     *     {
     *       "id": 1,
     *       "query": "capacitor",
     *       "created_at": "2026-04-21T10:30:00.000000Z"
     *     },
     *     {
     *       "id": 2,
     *       "query": "resistor",
     *       "created_at": "2026-04-20T15:45:00.000000Z"
     *     }
     *   ]
     * }
     */
    public function index(Request $request)
    {
        $limit = min(50, max(1, (int) ($request->get('limit') ?? 20)));

        $suggestions = SearchSuggestion::where('user_id', auth()->id())
            ->groupBy('query')
            ->selectRaw('id, query, MAX(created_at) as latest_created_at')
            ->orderBy('latest_created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($suggestion) {
                return [
                    'id' => $suggestion->id,
                    'query' => $suggestion->query,
                    'created_at' => $suggestion->latest_created_at,
                ];
            });

        return $this->successResponse($suggestions, 'Suggestions retrieved');
    }

    /**
     * Delete Search Suggestion
     *
     * Delete a specific search suggestion.
     *
     * @authenticated
     * @urlParam id integer required Suggestion ID. Example: 1
     *
     * @response 200 {
     *   "success": true,
     *   "message": "Search suggestion deleted"
     * }
     */
    public function destroy($id)
    {
        $suggestion = SearchSuggestion::where('user_id', auth()->id())
            ->findOrFail($id);

        $suggestion->delete();

        return $this->successResponse(null, 'Search suggestion deleted');
    }

    /**
     * Clear All Search Suggestions
     *
     * Delete all search suggestions for the authenticated user.
     *
     * @authenticated
     *
     * @response 200 {
     *   "success": true,
     *   "message": "All search suggestions cleared"
     * }
     */
    public function clear()
    {
        SearchSuggestion::where('user_id', auth()->id())->delete();

        return $this->successResponse(null, 'All search suggestions cleared');
    }

    /**
     * Auto-complete Suggestions
     *
     * Get suggestions that match a partial query (for auto-complete functionality).
     *
     * @authenticated
     * @queryParam q string required Partial query to match. Example: cap
     * @queryParam limit integer Maximum number of suggestions. Example: 5
     *
     * @response 200 {
     *   "success": true,
     *   "message": "Auto-complete suggestions retrieved",
     *   "data": [
     *     "capacitor",
     *     "capacitor kit",
     *     "ceramic capacitor"
     *   ]
     * }
     */
    public function autocomplete(Request $request)
    {
        $request->validate([
            'q' => ['required', 'string', 'min:1'],
        ]);

        $query = trim($request->input('q'));
        $limit = min(10, max(1, (int) ($request->get('limit') ?? 5)));

        $suggestions = SearchSuggestion::where('user_id', auth()->id())
            ->where('query', 'like', "%{$query}%")
            ->groupBy('query')
            ->selectRaw('query, MAX(created_at) as latest_created_at')
            ->orderBy('latest_created_at', 'desc')
            ->limit($limit)
            ->pluck('query');

        return $this->successResponse($suggestions, 'Auto-complete suggestions retrieved');
    }
}
