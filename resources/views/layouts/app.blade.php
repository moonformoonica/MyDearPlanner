<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DearPlanner - Laravel Monolith</title>
    <!-- Tailwind CSS via CDN for simplicity in this example -->
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#FFF0F5] text-slate-800 font-sans flex h-screen overflow-hidden">
    
    <!-- Sidebar -->
    <aside class="w-64 bg-pink-100/80 border-r border-pink-200 flex flex-col">
        <div class="p-4 flex items-center gap-2 font-semibold text-pink-700">
            <div class="bg-pink-500 text-white p-1.5 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            </div>
            <span class="text-lg tracking-tight">DearPlanner</span>
        </div>

        <nav class="flex-1 px-3 py-4 space-y-1">
            <a href="{{ route('dashboard') }}" class="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium {{ request()->routeIs('dashboard') ? 'bg-pink-200 text-pink-800' : 'text-pink-600 hover:bg-pink-200/50' }}">
                Dashboard
            </a>
            <a href="{{ route('tasks.index') }}" class="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium {{ request()->routeIs('tasks.*') ? 'bg-pink-200 text-pink-800' : 'text-pink-600 hover:bg-pink-200/50' }}">
                Assignments
            </a>
        </nav>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col h-full overflow-hidden bg-white/40">
        <header class="h-14 border-b border-pink-100 flex items-center px-4 bg-white/60">
            <div class="flex items-center text-sm text-pink-400 font-medium">
                <span>DearPlanner</span>
                <span class="mx-2">/</span>
                <span class="text-pink-700 capitalize">Laravel Version</span>
            </div>
        </header>

        <div class="flex-1 overflow-y-auto p-6 md:p-10">
            <div class="max-w-4xl mx-auto">
                @if(session('success'))
                    <div class="mb-4 p-4 bg-green-100 text-green-700 rounded-xl border border-green-200">
                        {{ session('success') }}
                    </div>
                @endif

                @yield('content')
            </div>
        </div>
    </main>

</body>
</html>
