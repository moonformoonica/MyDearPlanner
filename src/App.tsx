import React, { useState, useEffect, useRef } from "react";
import {
  Book,
  CalendarDays,
  CheckSquare,
  LayoutDashboard,
  Menu,
  Plus,
  Settings,
  X,
  Quote,
  GraduationCap,
  Trash2,
  Clock,
  StickyNote,
  LogOut,
  Upload,
  User,
  BookOpenCheck,
  LibraryBig,
  BookHeart,
  NotebookPen,
  Shell,
} from "lucide-react";
import { format } from "date-fns";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types
type Task = {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string;
  course: string;
};
type Course = { id: string; name: string; code: string; professor: string };
type Schedules = {
  id: string;
  title: string;
  time: string;
  day: string;
  type: string;
};
type Note = { id: string; title: string; content: string; date: string };
type UserData = { id: string; username: string; profile_pic: string };

export default function App() {
  // --- AUTH STATE ---
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );
  const [user, setUser] = useState<UserData | null>(
    JSON.parse(localStorage.getItem("user") || "null"),
  );

  const[loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");

  const [isRegistering, setIsRegistering] = useState(false);
  const[registerForm, setRegisterForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });

  // --- APP STATE ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const[quote, setQuote] = useState<{ quote: string; author: string } | null>(
    null,
  );
  const [quoteAnim, setQuoteAnim] = useState<
    "entering" | "entered" | "exiting"
  >("entering");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Pinterest State
  // Pinterest State
  const [pinterestPins, setPinterestPins] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
  ]);
  const [pinIndices, setPinIndices] = useState<number[]>([0, 1, 2, 3, 4]);
  const [isFadingPins, setIsFadingPins] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const[courses, setCourses] = useState<Course[]>([]);
  const [schedules, setSchedules] = useState<Schedules[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  // Form states
  const [newTask, setNewTask] = useState({
    title: "",
    dueDate: format(new Date(), "yyyy-MM-dd"),
    course: "General",
  });
  const [newCourse, setNewCourse] = useState({
    name: "",
    code: "",
    professor: "",
  });
  const [newSchedules, setNewSchedules] = useState({
    title: "",
    time: "",
    day: "Monday",
    type: "Class",
  });
  const [newNote, setNewNote] = useState({ title: "", content: "" });

  // Settings state
  const [newPassword, setNewPassword] = useState("");
  const[settingsMsg, setSettingsMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    } as any;
    if (
      !(options.body instanceof FormData) &&
      typeof options.body === "string"
    ) {
      headers["Content-Type"] = "application/json";
    }
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401 || res.status === 403) handleLogout();
    return res;
  };

  // Fetch Data & Public API Quote
  useEffect(() => {
    if (!token) return;

    const fetchQuote = (isInitial = false) => {
      if (!isInitial) setQuoteAnim("exiting");
      setTimeout(
        () => {
          fetch("https://dummyjson.com/quotes/random")
            .then((res) => res.json())
            .then((data) => {
              if (data && data.quote) {
                setQuote({ quote: data.quote, author: data.author });
              } else {
                setQuote({
                  quote: "The secret of getting ahead is getting started.",
                  author: "Mark Twain",
                });
              }
              setQuoteAnim("entering");
              setTimeout(() => setQuoteAnim("entered"), 50);
            })
            .catch(() => {
              setQuote({
                quote: "The secret of getting ahead is getting started.",
                author: "Mark Twain",
              });
              setQuoteAnim("entering");
              setTimeout(() => setQuoteAnim("entered"), 50);
            });
        },
        isInitial ? 0 : 500,
      );
    };

    fetchQuote(true);
    const quoteTimer = setInterval(() => fetchQuote(false), 3773);

    fetchWithAuth("/api/tasks")
      .then((res) => (res.ok ? res.json() :[]))
      .then(setTasks)
      .catch(() => {});
    fetchWithAuth("/api/courses")
      .then((res) => (res.ok ? res.json() :[]))
      .then(setCourses)
      .catch(() => {});
    fetchWithAuth("/api/schedules")
      .then((res) => (res.ok ? res.json() :[]))
      .then(setSchedules)
      .catch(() => {});
    fetchWithAuth("/api/notes")
      .then((res) => (res.ok ? res.json() :[]))
      .then(setNotes)
      .catch(() => {});

    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => {
      clearInterval(timer);
      clearInterval(quoteTimer);
    };
  }, [token]);

  // Fetch Pinterest Pins
  useEffect(() => {
    if (!token) return;
    fetch(
      "https://api.rss2json.com/v1/api.json?rss_url=https://www.pinterest.com/m00dygurllll/campur-dlu-deh-ya-rapihinnya-kpn.rss",
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.items && data.items.length > 0) {
          const imageUrls = data.items
            .map((item: any) => {
              const match = item.description.match(/src="([^"]+)"/);
              let url = match ? match[1] : null;
              if (url) url = url.replace("236x", "736x");
              return url;
            })
            .filter(Boolean);
          if (imageUrls.length >= 5) setPinterestPins(imageUrls);
        }
      })
      .catch((err) => console.error("Error fetching Pinterest feed:", err));
  }, [token]);

  // Pinterest Slideshow Timer
  useEffect(() => {
    if (!token || pinterestPins.length <= 5) return;
    const interval = setInterval(() => {
      setIsFadingPins(true);
      setTimeout(() => {
        setPinIndices((prev) =>
          prev.map((idx) => (idx + 1) % pinterestPins.length),
        );
        setIsFadingPins(false);
      }, 500);
    }, 3000);
    return () => clearInterval(interval);
  }, [token, pinterestPins]);

  // --- AUTH LOGIC ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const text = await res.text();
      if (!text)
        throw new Error(
          "Server is down! Did you restart the backend terminal? 💻",
        );

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("Server Error!");
      }

      if (!res.ok) throw new Error(data.error);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    } catch (err: any) {
      setLoginError(err.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (registerForm.password !== registerForm.confirmPassword) {
      setLoginError("Passwords don't match! (＞﹏＜)");
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: registerForm.username,
          password: registerForm.password,
        }),
      });

      const text = await res.text();
      if (!text)
        throw new Error(
          "Server didn't respond! Did you restart the backend? 🥺",
        );

      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        throw new Error("Server error! Check VS Code terminal 💻");
      }

      if (!res.ok) throw new Error(data.error || "Failed to register");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    } catch (err: any) {
      setLoginError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  // --- SETTINGS LOGIC ---
  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const res = await fetchWithAuth("/api/user/profile", {
        method: "PUT",
        body: JSON.stringify({ profile_pic: base64String }),
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setSettingsMsg("Profile picture updated! 🖼️");
        setTimeout(() => setSettingsMsg(""), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    const res = await fetchWithAuth("/api/user/profile", {
      method: "PUT",
      body: JSON.stringify({ newPassword }),
    });
    if (res.ok) {
      setNewPassword("");
      setSettingsMsg("Password updated successfully! 🔒");
      setTimeout(() => setSettingsMsg(""), 3000);
    }
  };

  // --- CRUD FUNCTIONS ---
  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetchWithAuth("/api/tasks", {
      method: "POST",
      body: JSON.stringify(newTask),
    });
    if (res.ok) {
      setTasks([...tasks, await res.json()]);
      setNewTask({
        title: "",
        dueDate: format(new Date(), "yyyy-MM-dd"),
        course: "General",
      });
    }
  };
  const toggleTask = async (task: Task) => {
    const updatedTask = { ...task, completed: !task.completed };
    if (updatedTask.dueDate.includes("T"))
      updatedTask.dueDate = updatedTask.dueDate.split("T")[0];
    const res = await fetchWithAuth(`/api/tasks/${task.id}`, {
      method: "PUT",
      body: JSON.stringify(updatedTask),
    });
    if (res.ok) {
      const updated = await res.json();
      setTasks(tasks.map((t) => (t.id === task.id ? updated : t)));
    }
  };
  const deleteTask = async (id: string) => {
    const res = await fetchWithAuth(`/api/tasks/${id}`, { method: "DELETE" });
    if (res.ok) setTasks(tasks.filter((t) => t.id !== id));
  };

  const addCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetchWithAuth("/api/courses", {
      method: "POST",
      body: JSON.stringify(newCourse),
    });
    if (res.ok) {
      setCourses([...courses, await res.json()]);
      setNewCourse({ name: "", code: "", professor: "" });
    }
  };
  const deleteCourse = async (id: string) => {
    const res = await fetchWithAuth(`/api/courses/${id}`, { method: "DELETE" });
    if (res.ok) setCourses(courses.filter((c) => c.id !== id));
  };

  const addSchedules = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetchWithAuth("/api/schedules", {
      method: "POST",
      body: JSON.stringify(newSchedules),
    });
    if (res.ok) {
      setSchedules([...schedules, await res.json()]);
      setNewSchedules({ title: "", time: "", day: "Monday", type: "Class" });
    }
  };
  const deleteSchedules = async (id: string) => {
    const res = await fetchWithAuth(`/api/schedules/${id}`, {
      method: "DELETE",
    });
    if (res.ok) setSchedules(schedules.filter((s) => s.id !== id));
  };

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetchWithAuth("/api/notes", {
      method: "POST",
      body: JSON.stringify(newNote),
    });
    if (res.ok) {
      setNotes([await res.json(), ...notes]);
      setNewNote({ title: "", content: "" });
    }
  };
  const deleteNote = async (id: string) => {
    const res = await fetchWithAuth(`/api/notes/${id}`, { method: "DELETE" });
    if (res.ok) setNotes(notes.filter((n) => n.id !== id));
  };

  // --- RENDER LOGIN/REGISTER SCREEN ---
  if (!token) {
    return (
      <div className="min-h-screen bg-[#FFF0F5] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-pink-100">
          <div className="flex justify-center mb-6">
            <div className="bg-pink-500 text-white p-3 rounded-2xl">
              <BookHeart size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-pink-900 mb-2">
            {isRegistering ? "Join Dear Planner ✨" : "Welcome Back, Dear 💝"}
          </h1>
          <p className="text-center text-pink-500 mb-8 text-sm">
            {isRegistering
              ? "Create an account to start your journey! (✿◡‿◡)"
              : "Would you login to your Dear Planner? (❁´◡`❁)"}
          </p>

          {loginError && (
            <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm mb-4 text-center">
              {loginError}
            </div>
          )}

          {isRegistering ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-pink-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={registerForm.username}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      username: e.target.value,
                    })
                  }
                  className="w-full bg-pink-50 border border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="Choose a cute username"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-pink-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      password: e.target.value,
                    })
                  }
                  className="w-full bg-pink-50 border border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="Create a strong password"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-pink-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={registerForm.confirmPassword}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full bg-pink-50 border border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="Type password again"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl transition-colors mt-4"
              >
                Register
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-pink-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, username: e.target.value })
                  }
                  className="w-full bg-pink-50 border border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="youngest333daughter"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-pink-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, password: e.target.value })
                  }
                  className="w-full bg-pink-50 border border-pink-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="Guess the password silly...o(一︿一+)o"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl transition-colors mt-4"
              >
                Login
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setLoginError("");
              }}
              className="text-sm text-pink-600 hover:text-pink-800 font-medium transition-colors"
            >
              {isRegistering
                ? "Already have an account? Login here 🎟️"
                : "Don't have an account? Register here 🎀"}
            </button>
          </div>
          <p className="text-center text-xs text-pink-400 mt-6">ᓚᘏᗢ</p>
        </div>
      </div>
    );
  }

  // --- RENDER MAIN APP ---
  const navItems =[
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "tasks", label: "To Do List", icon: BookOpenCheck },
    { id: "schedules", label: "Schedules", icon: CalendarDays },
    { id: "courses", label: "Courses", icon: LibraryBig },
    { id: "notes", label: "Notes", icon: NotebookPen },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const currentHour = currentTime.getHours();
  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 18
        ? "Good afternoon"
        : "Good evening";
  const displayName = user?.username
    ? user.username.charAt(0).toUpperCase() + user.username.slice(1)
    : "Student";

  return (
    <div className="flex h-screen bg-[#FFF0F5] text-slate-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-pink-100/80 backdrop-blur-md border-r border-pink-200 transition-all duration-300 flex flex-col",
          isSidebarOpen ? "w-64" : "w-0 opacity-0 md:w-20 md:opacity-100",
        )}
      >
        <div className="p-4 flex items-center justify-between">
          <div
            className={cn(
              "flex items-center gap-2 font-semibold text-pink-700",
              !isSidebarOpen && "md:hidden",
            )}
          >
            <div className="bg-pink-500 text-white p-1.5 rounded-lg">
              <BookHeart size={20} />
            </div>
            <span className="text-lg tracking-tight">My Dear Planner</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-pink-600 hover:bg-pink-200 p-1 rounded-md"
          >
            <X size={20} />
          </button>
        </div>

        <div
          className={cn(
            "px-4 py-4 mb-2 flex flex-col items-center border-b border-pink-200/50",
            !isSidebarOpen && "md:hidden",
          )}
        >
          <div className="w-16 h-16 rounded-full bg-pink-200 border-2 border-white shadow-sm overflow-hidden mb-2 flex items-center justify-center">
            {user?.profile_pic ? (
              <img
                src={user.profile_pic}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={32} className="text-pink-400" />
            )}
          </div>
          <p className="font-bold text-pink-900">{displayName}</p>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  activeTab === item.id
                    ? "bg-pink-200 text-pink-800"
                    : "text-pink-600 hover:bg-pink-200/50 hover:text-pink-800",
                  !isSidebarOpen && "md:justify-center",
                )}
              >
                <Icon size={18} />
                <span className={cn(!isSidebarOpen && "md:hidden")}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-pink-200/50">
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-red-500 hover:bg-red-50 transition-colors",
              !isSidebarOpen && "md:justify-center",
            )}
          >
            <LogOut size={18} />
            <span className={cn(!isSidebarOpen && "md:hidden")}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-white/40">
        <header className="h-14 border-b border-pink-100 flex items-center justify-between px-4 bg-white/60 backdrop-blur-sm">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-pink-500 hover:bg-pink-100 p-1.5 rounded-md transition-colors mr-4"
            >
              <Menu size={20} />
            </button>
            <span className="text-sm text-pink-400 font-medium capitalize">
              {activeTab}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-pink-200 overflow-hidden border border-pink-300 flex items-center justify-center">
            {user?.profile_pic ? (
              <img
                src={user.profile_pic}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={20} className="text-pink-400" />
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-4xl mx-auto">
            {/* DASHBOARD */}
            {activeTab === "dashboard" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div>
                  <h1 className="text-3xl font-bold text-pink-900 mb-2">
                    {greeting}, {displayName}! 💌
                  </h1>
                  <p className="text-pink-600">
                    ~(=^‥^)ノ Here's your overview for{" "}
                    {format(currentTime, "EEEE, MMMM do")}.
                  </p>
                </div>

                {quote && (
                  <div className="relative p-[3px] rounded-[19px] overflow-hidden shadow-sm z-10 flex flex-col">
                    <div className="absolute inset-[-100%] glow-bg-quotes -z-10"></div>
                    <div className="bg-moving-gradient rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex-1 h-full z-10">
                      <Quote
                        className="absolute right-4 top-4 opacity-20"
                        size={48}
                      />
                      <div
                        className={cn(
                          "relative z-10",
                          quoteAnim === "entered" &&
                            "transition-all duration-500 ease-out opacity-100 translate-x-0",
                          quoteAnim === "exiting" &&
                            "transition-all duration-500 ease-in opacity-0 -translate-x-12",
                          quoteAnim === "entering" &&
                            "opacity-0 translate-x-12",
                        )}
                      >
                        <p className="text-lg font-medium italic mb-2">
                          "{quote.quote}"
                        </p>
                        <p className="text-pink-100 text-sm">
                          — {quote.author}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative p-[3px] rounded-[19px] overflow-hidden shadow-sm z-10 flex flex-col">
                    <div className="absolute inset-[-100%] glow-bg-left -z-10"></div>
                    <div className="bg-white rounded-2xl p-6 flex-1 h-full z-10">
                      <h2 className="text-lg font-semibold text-pink-800 mb-4 flex items-center gap-2">
                        <BookOpenCheck size={20} className="text-pink-500" />{" "}
                        Whatchu Have To Do?!🧐
                      </h2>
                      <div className="space-y-3">
                        {tasks
                          .filter((t) => !t.completed)
                          .slice(0, 3)
                          .map((task) => (
                            <div
                              key={task.id}
                              className="flex items-start gap-3 p-3 rounded-lg hover:bg-pink-50 border border-transparent hover:border-pink-100"
                            >
                              <button
                                onClick={() => toggleTask(task)}
                                className="mt-0.5 text-pink-300 hover:text-pink-500"
                              >
                                <div className="w-5 h-5 rounded border-2 border-current flex items-center justify-center"></div>
                              </button>
                              <div>
                                <p className="text-sm font-medium text-slate-700">
                                  {task.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-pink-500">
                                  <span className="bg-pink-100 px-2 py-0.5 rounded-full">
                                    {task.course}
                                  </span>
                                  <span>
                                    Due{" "}
                                    {format(new Date(task.dueDate), "MMM d")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        {tasks.filter((t) => !t.completed).length === 0 && (
                          <p className="text-sm text-pink-400">
                            All caught up! \^o^/
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="relative p-[3px] rounded-[19px] overflow-hidden shadow-sm z-10 flex flex-col">
                    <div className="absolute inset-[-100%] glow-bg-right -z-10"></div>
                    <div className="bg-white rounded-2xl p-6 flex-1 h-full z-10">
                      <h2 className="text-lg font-semibold text-pink-800 mb-4 flex items-center gap-2">
                        <Clock size={20} className="text-pink-500" /> Today's
                        Schedules📅
                      </h2>
                      <div className="space-y-4">
                        {schedules
                          .filter((s) => s.day === format(currentTime, "EEEE"))
                          .map((schedules) => (
                            <div
                              key={schedules.id}
                              className="flex items-center gap-4"
                            >
                              <div className="w-16 text-right text-sm font-bold text-pink-500">
                                {schedules.time}
                              </div>
                              <div className="flex-1 bg-pink-50 rounded-xl p-3 border border-pink-100">
                                <p className="font-medium text-slate-700">
                                  {schedules.title}
                                </p>
                                <p className="text-xs text-pink-500 mt-1">
                                  {schedules.type}
                                </p>
                              </div>
                            </div>
                          ))}
                        {schedules.filter(
                          (s) => s.day === format(currentTime, "EEEE"),
                        ).length === 0 && (
                          <p className="text-sm text-pink-400">
                            No classes today! o(*￣︶￣*)o
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 animate-in fade-in duration-377 delay-377">
                  <h2 className="text-xl font-bold text-pink-900 mb-4 flex items-center gap-2">
                    <Shell size={24} className="text-pink-500" /> The Board Of
                    Your Soul🪽
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {pinIndices.map((pinIdx, i) => (
                      <div
                        key={i}
                        className="relative p-[3px] rounded-[19px] overflow-hidden shadow-sm z-10 flex flex-col aspect-[3/4]"
                      >
                        <div className="absolute inset-[-100%] glow-bg-pinterest -z-10"></div>
                        <div className="bg-white rounded-2xl p-1 flex-1 h-full z-10 overflow-hidden relative">
                          <img
                            src={pinterestPins[pinIdx]}
                            alt="Pinterest Inspiration"
                            className={cn(
                              "w-full h-full object-cover rounded-xl transition-opacity duration-1000",
                              isFadingPins ? "opacity-0" : "opacity-100",
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TASKS */}
            {activeTab === "tasks" && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-bold text-pink-900">
                    To Do List📝
                  </h1>
                  <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm font-medium">
                    {tasks.filter((t) => !t.completed).length} pending
                  </span>
                </div>

                <form onSubmit={addTask} className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                    placeholder="Add your new to do list!( •̀ ω •́ )✧"
                    required
                    className="flex-1 min-w-[200px] bg-white border border-pink-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                  <input
                    type="text"
                    value={newTask.course}
                    onChange={(e) =>
                      setNewTask({ ...newTask, course: e.target.value })
                    }
                    placeholder="What is it?"
                    required
                    className="w-32 bg-white border border-pink-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) =>
                      setNewTask({ ...newTask, dueDate: e.target.value })
                    }
                    required
                    className="w-40 bg-white border border-pink-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                  <button
                    type="submit"
                    className="bg-pink-500 hover:bg-pink-600 text-white rounded-xl px-4 py-3 font-medium shadow-sm"
                  >
                    Add Task
                  </button>
                </form>

                <div className="bg-white rounded-2xl border border-pink-100 shadow-sm overflow-hidden">
                  {tasks.length === 0 ? (
                    <div className="p-8 text-center text-pink-400">
                      No lists to do yet. You're~~free~~free! (～￣▽￣)～🎈
                    </div>
                  ) : (
                    <ul className="divide-y divide-pink-50">
                      {tasks.map((task) => (
                        <li
                          key={task.id}
                          className={cn(
                            "p-4 flex items-center gap-4 hover:bg-pink-50/50 transition-colors group",
                            task.completed && "opacity-60",
                          )}
                        >
                          <button
                            onClick={() => toggleTask(task)}
                            className={cn(
                              "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors",
                              task.completed
                                ? "bg-pink-500 border-pink-500 text-white"
                                : "border-pink-300 text-transparent hover:border-pink-500",
                            )}
                          >
                            <BookOpenCheck size={16} />
                          </button>
                          <div className="flex-1">
                            <p
                              className={cn(
                                "font-medium text-slate-700",
                                task.completed && "line-through text-slate-400",
                              )}
                            >
                              {task.title}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-pink-500">
                              <span className="bg-pink-100 px-2 py-0.5 rounded-md">
                                {task.course}
                              </span>
                              <span className="flex items-center gap-1">
                                <CalendarDays size={12} />{" "}
                                {format(new Date(task.dueDate), "MMM d, yyyy")}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-pink-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                          >
                            <Trash2 size={18} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* SCHEDULES */}
            {activeTab === "schedules" && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <h1 className="text-3xl font-bold text-pink-900">
                  Dearest Schedules📅
                </h1>
                <form
                  onSubmit={addSchedules}
                  className="bg-white p-4 rounded-2xl border border-pink-100 shadow-sm flex flex-wrap gap-3"
                >
                  <input
                    type="text"
                    value={newSchedules.title}
                    onChange={(e) =>
                      setNewSchedules({
                        ...newSchedules,
                        title: e.target.value,
                      })
                    }
                    placeholder="Type your scheduleヾ(＠⌒ー⌒＠)ノ"
                    required
                    className="flex-1 min-w-[150px] bg-pink-50 border border-pink-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                  <input
                    type="time"
                    value={newSchedules.time}
                    onChange={(e) =>
                      setNewSchedules({ ...newSchedules, time: e.target.value })
                    }
                    required
                    className="w-32 bg-pink-50 border border-pink-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                  <select
                    value={newSchedules.day}
                    onChange={(e) =>
                      setNewSchedules({ ...newSchedules, day: e.target.value })
                    }
                    className="w-36 bg-pink-50 border border-pink-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  >
                    {[
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                    ].map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newSchedules.type}
                    onChange={(e) =>
                      setNewSchedules({ ...newSchedules, type: e.target.value })
                    }
                    className="w-32 bg-pink-50 border border-pink-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  >
                    <option value="Lecture">Lecture</option>
                    <option value="Lab Practicum">Lab Practicum</option>
                    <option value="Project">Project</option>
                    <option value="Work">Work</option>
                    <option value="Seminar/Webinar">Seminar/Webinar</option>
                  </select>
                  <button
                    type="submit"
                    className="bg-pink-500 hover:bg-pink-600 text-white rounded-xl px-4 py-2 font-medium"
                  >
                    <Plus size={20} />
                  </button>
                </form>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
                    (day) => (
                      <div
                        key={day}
                        className="bg-white rounded-2xl border border-pink-100 shadow-sm overflow-hidden"
                      >
                        <div className="bg-pink-50 py-3 px-4 border-b border-pink-100 font-bold text-pink-800 text-center">
                          {day}
                        </div>
                        <div className="p-3 space-y-3 min-h-[200px]">
                          {schedules
                            .filter((s) => s.day === day)
                            .sort((a, b) => a.time.localeCompare(b.time))
                            .map((schedules) => (
                              <div
                                key={schedules.id}
                                className="bg-pink-50/50 rounded-xl p-3 border border-pink-100 relative group"
                              >
                                <button
                                  onClick={() => deleteSchedules(schedules.id)}
                                  className="absolute top-2 right-2 text-pink-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 size={14} />
                                </button>
                                <div className="text-xs font-bold text-pink-500 mb-1">
                                  {schedules.time}
                                </div>
                                <div className="font-medium text-slate-700 text-sm leading-tight">
                                  {schedules.title}
                                </div>
                                <div className="text-xs text-pink-400 mt-2">
                                  {schedules.type}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* COURSES */}
            {activeTab === "courses" && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <h1 className="text-3xl font-bold text-pink-900">
                  Dearest Courses📚
                </h1>
                <form
                  onSubmit={addCourse}
                  className="bg-white p-4 rounded-2xl border border-pink-100 shadow-sm flex flex-wrap gap-3"
                >
                  <input
                    type="text"
                    value={newCourse.code}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, code: e.target.value })
                    }
                    placeholder="Room (e.g., CS101)"
                    required
                    className="w-36 bg-pink-50 border border-pink-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                  <input
                    type="text"
                    value={newCourse.name}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, name: e.target.value })
                    }
                    placeholder="Course Name"
                    required
                    className="flex-1 min-w-[200px] bg-pink-50 border border-pink-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                  <input
                    type="text"
                    value={newCourse.professor}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, professor: e.target.value })
                    }
                    placeholder="Professor Name"
                    required
                    className="w-48 bg-pink-50 border border-pink-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                  <button
                    type="submit"
                    className="bg-pink-500 hover:bg-pink-600 text-white rounded-xl px-4 py-2 font-medium"
                  >
                    <Plus size={20} />
                  </button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm relative group"
                    >
                      <button
                        onClick={() => deleteCourse(course.id)}
                        className="absolute top-4 right-4 text-pink-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                      <div className="w-fit min-w-[3rem] px-3 h-10 bg-pink-100 text-pink-600 rounded-xl flex items-center justify-center font-bold mb-4 whitespace-nowrap">
                        {course.code}
                      </div>
                      <h3 className="font-bold text-slate-800 text-lg mb-1 leading-tight">
                        {course.name}
                      </h3>
                      <p className="text-pink-500 text-sm flex items-center gap-2">
                        <User size={14} /> {course.professor}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NOTES */}
            {activeTab === "notes" && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <h1 className="text-3xl font-bold text-pink-900">
                  Dearest Notes📝
                </h1>
                <form
                  onSubmit={addNote}
                  className="bg-white p-5 rounded-2xl border border-pink-100 shadow-sm flex flex-col gap-3"
                >
                  <input
                    type="text"
                    value={newNote.title}
                    onChange={(e) =>
                      setNewNote({ ...newNote, title: e.target.value })
                    }
                    placeholder="Note Title"
                    className="w-full bg-pink-50 border border-pink-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                  <textarea
                    value={newNote.content}
                    onChange={(e) =>
                      setNewNote({ ...newNote, content: e.target.value })
                    }
                    placeholder="Write your thoughts here..."
                    rows={3}
                    className="w-full bg-pink-50 border border-pink-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-pink-500 hover:bg-pink-600 text-white rounded-xl px-5 py-2 flex items-center gap-2 font-medium"
                    >
                      <Plus size={18} /> Save Note
                    </button>
                  </div>
                </form>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {notes.map((note) => (
                    <div key={note.id} className="bg-yellow-50 rounded-2xl p-5 border border-yellow-200 relative group">
                      <button onClick={() => deleteNote(note.id)} className="absolute top-4 right-4 text-yellow-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                      <h3 className="font-bold text-yellow-900 mb-2">{note.title}</h3>
                      <p className="text-sm text-yellow-800 whitespace-pre-wrap break-all">{note.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SETTINGS */}
            {activeTab === "settings" && (
              <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl">
                <h1 className="text-3xl font-bold text-pink-900 mb-6">
                  Profile Settings⚙️
                </h1>
                {settingsMsg && (
                  <div className="bg-green-50 text-green-600 p-3 rounded-xl text-sm font-medium border border-green-200">
                    {settingsMsg}
                  </div>
                )}

                <div className="bg-white p-6 rounded-2xl border border-pink-100 shadow-sm flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-pink-100 border-4 border-pink-50 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {user?.profile_pic ? (
                      <img
                        src={user.profile_pic}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={40} className="text-pink-300" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-pink-900 text-lg mb-1">
                      {displayName}
                    </h3>
                    <p className="text-sm text-pink-500 mb-3">
                      Update your profile picture
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleProfilePicChange}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-pink-100 hover:bg-pink-200 text-pink-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Upload size={16} /> Choose Image
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-pink-100 shadow-sm">
                  <h3 className="font-bold text-pink-900 text-lg mb-4">
                    Change Password
                  </h3>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-pink-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-pink-50 border border-pink-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
                        placeholder="Enter new password"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-pink-500 hover:bg-pink-600 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors"
                    >
                      Update Password
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}