@extends('layouts.app')

@section('content')
<div class="space-y-8">
    <div>
        <h1 class="text-3xl font-bold text-pink-900 mb-2">Good morning, Student! ✨</h1>
        <p class="text-pink-600">Here's your overview for today.</p>
    </div>

    <!-- Public API Integration Section -->
    <div class="bg-gradient-to-r from-pink-100 to-rose-50 rounded-2xl p-6 border border-pink-200 shadow-sm relative overflow-hidden">
        <div class="relative z-10">
            <h3 class="text-xs font-bold uppercase tracking-wider text-pink-500 mb-3 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-pink-400 animate-pulse"></span>
                Daily Motivation (Public API)
            </h3>
            @if($quote)
                <blockquote class="space-y-2">
                    <p class="text-lg md:text-xl font-medium text-pink-900 italic">"{{ $quote['quote'] }}"</p>
                    <footer class="text-sm text-pink-600 font-medium">— {{ $quote['author'] }}</footer>
                </blockquote>
            @else
                <p class="text-pink-500">Could not load today's quote.</p>
            @endif
        </div>
    </div>

    <!-- Up Next Tasks -->
    <div class="bg-white rounded-2xl p-6 border border-pink-100 shadow-sm">
        <h2 class="text-lg font-semibold text-pink-800 mb-4">Up Next</h2>
        <div class="space-y-3">
            @forelse($tasks as $task)
                <div class="flex items-start gap-3 p-3 rounded-lg hover:bg-pink-50 transition-colors border border-transparent hover:border-pink-100">
                    <div>
                        <p class="text-sm font-medium text-slate-700">{{ $task->title }}</p>
                        <div class="flex items-center gap-2 mt-1 text-xs text-pink-500">
                            <span class="bg-pink-100 px-2 py-0.5 rounded-full">{{ $task->course }}</span>
                            <span>Due {{ $task->due_date->format('M d, Y') }}</span>
                        </div>
                    </div>
                </div>
            @empty
                <p class="text-sm text-pink-400">All caught up! No pending tasks.</p>
            @endforelse
        </div>
    </div>
</div>
@endsection
