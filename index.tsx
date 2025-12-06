import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Rocket, Zap, Terminal, Code, Layout, Settings, Users, 
  CreditCard, BarChart3, Shield, Box, Github, Globe, 
  CheckCircle, Loader2, Play, Lock, AlertTriangle, 
  ChevronRight, RefreshCw, Cpu, Database, Eye, Download,
  MessageSquare, Send, Paperclip, MoreVertical, FileCode, Layers,
  Edit2, X, Server, PlayCircle, Check, Copy, Plus, Trash2, Palette,
  Mail, Smartphone, Cloud, ExternalLink, Key, Laptop, Tablet,
  Wifi, Battery, Signal, Menu, ArrowLeft, Home, CheckSquare, Calendar,
  FileText
} from 'lucide-react';

// --- TYPES ---

interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'user';
  status: 'active' | 'suspended';
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  assignee: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
}

interface ProviderConfig {
  id: string;
  name: string;
  type: 'llm' | 'hosting' | 'payment';
  status: 'active' | 'inactive';
  apiKey?: string;
  usage: number; // Percentage 0-100
  priority: number;
}

interface AppSettings {
  appName: string;
  primaryColor: string;
}

interface GeneratedAppSpec {
  name: string;
  description: string;
  stack: string[];
  pages: { name: string; description: string; components: string[] }[];
  database: { model: string; fields: string[] }[];
  apiRoutes: { method: string; path: string; description: string }[];
}

interface BuilderConfig {
  prompt: string;
  platform: 'web' | 'mobile';
  framework: string;
}

// --- MOCK DATA ---

const MOCK_USERS: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@hellojadan.ai', role: 'super_admin', status: 'active', plan: 'enterprise', createdAt: '2023-01-01' },
  { id: '2', name: 'Alice Dev', email: 'alice@dev.co', role: 'user', status: 'active', plan: 'pro', createdAt: '2023-05-12' },
  { id: '3', name: 'Bob Corp', email: 'bob@corp.inc', role: 'user', status: 'suspended', plan: 'free', createdAt: '2023-06-20' },
  { id: '4', name: 'Startup Steve', email: 'steve@ycombinator.mock', role: 'user', status: 'active', plan: 'pro', createdAt: '2023-08-15' },
];

const MOCK_TASKS: Task[] = [
  { id: '1', title: 'Review new AI templates', assignee: 'Admin User', status: 'in-progress', priority: 'high', dueDate: '2023-10-25' },
  { id: '2', title: 'Fix billing integration bug', assignee: 'Alice Dev', status: 'todo', priority: 'high', dueDate: '2023-10-26' },
  { id: '3', title: 'Update documentation', assignee: 'Bob Corp', status: 'done', priority: 'low', dueDate: '2023-10-20' },
  { id: '4', title: 'Rotate API Keys', assignee: 'Admin User', status: 'todo', priority: 'medium', dueDate: '2023-10-28' },
];

const INITIAL_PROVIDERS: ProviderConfig[] = [
  { id: 'p1', name: 'Gemini 2.5 Flash', type: 'llm', status: 'active', usage: 45, priority: 1, apiKey: 'AIzaSyCAXDDdWsW8EheoN8rpnnKBINA79MI8ENM' },
  { id: 'p2', name: 'Anthropic Claude 3', type: 'llm', status: 'active', usage: 20, priority: 2 },
  { id: 'p3', name: 'OpenAI GPT-4o', type: 'llm', status: 'inactive', usage: 0, priority: 3 },
  { id: 'p4', name: 'Vercel', type: 'hosting', status: 'active', usage: 60, priority: 1 },
];

// --- AI SERVICE ---

class AppGeneratorService {
  private ai: GoogleGenAI;

  constructor(apiKey?: string) {
    const key = apiKey && apiKey.trim() !== '' ? apiKey : (process.env.API_KEY || '');
    this.ai = new GoogleGenAI({ apiKey: key });
  }

  async generateAppSpec(prompt: string, platform: string, framework: string): Promise<GeneratedAppSpec> {
    const model = this.ai.models;
    
    const isMobile = platform === 'mobile';
    const role = isMobile ? 'Mobile App Architect' : 'Full Stack Web Architect';
    const context = isMobile 
      ? `The user wants a mobile app using ${framework}. Treat 'pages' as mobile screens. The stack should be ${framework} + suitable backend.` 
      : `The user wants a web app using ${framework}. The stack should be ${framework} + Tailwind CSS + Prisma + Database.`;

    const systemPrompt = `
      You are a world-class ${role}. 
      Your goal is to accept a short app idea and generate a complete technical specification for a modern application.
      Context: ${context}
      
      Return a JSON object with:
      1. 'name': A creative name for the app.
      2. 'description': A professional 1-sentence tagline.
      3. 'stack': Array of technologies used (include ${framework}).
      4. 'pages': List of ${isMobile ? 'screens' : 'frontend pages'} with components.
      5. 'database': List of database models and fields.
      6. 'apiRoutes': List of backend API endpoints needed.
    `;

    try {
      const result = await model.generateContent({
        model: 'gemini-2.5-flash', // Switched to flash for stability, can use gemini-3-pro-preview if key supports it
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              stack: { type: Type.ARRAY, items: { type: Type.STRING } },
              pages: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    components: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              },
              database: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    model: { type: Type.STRING },
                    fields: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              },
              apiRoutes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    method: { type: Type.STRING },
                    path: { type: Type.STRING },
                    description: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });
      
      const parsed = JSON.parse(result.text || '{}');
      return {
        name: parsed.name || "Untitled App",
        description: parsed.description || "No description generated.",
        stack: Array.isArray(parsed.stack) ? parsed.stack : [],
        pages: Array.isArray(parsed.pages) ? parsed.pages : [],
        database: Array.isArray(parsed.database) ? parsed.database : [],
        apiRoutes: Array.isArray(parsed.apiRoutes) ? parsed.apiRoutes : []
      };
    } catch (error) {
      console.error("AI Generation failed:", error);
      // FALLBACK TO LOCAL GENERATION ON ERROR (e.g. Network/Quota issues)
      return this.generateFallbackSpec(prompt, platform, framework);
    }
  }

  private generateFallbackSpec(prompt: string, platform: string, framework: string): GeneratedAppSpec {
    const isMobile = platform === 'mobile';
    const cleanPrompt = prompt.toLowerCase();
    
    // Simple heuristics to make the fallback feel responsive to the user's intent
    const isDashboard = cleanPrompt.includes('dashboard') || cleanPrompt.includes('admin') || cleanPrompt.includes('analytics');
    const isCommerce = cleanPrompt.includes('shop') || cleanPrompt.includes('store') || cleanPrompt.includes('market');
    
    const appName = isDashboard ? "NovaDash" : isCommerce ? "MarketPro" : "StartApp";

    if (isMobile) {
        return {
            name: appName + " Mobile",
            description: `A ${framework} mobile application optimized for performance and user experience.`,
            stack: [framework, "React Navigation", "Supabase", "Expo"],
            pages: [
                { 
                    name: "Home", 
                    description: "Main dashboard with activity summary and quick actions.", 
                    components: ["Header", "StatusCard", "RecentActivityList", "QuickActionGrid"] 
                },
                { 
                    name: "Explore", 
                    description: "Search and discovery interface.", 
                    components: ["SearchBar", "CategoryTabs", "FeaturedItems", "TrendingList"] 
                },
                { 
                    name: "Profile", 
                    description: "User profile and settings management.", 
                    components: ["AvatarHeader", "SettingsMenu", "NotificationToggle", "SignOutButton"] 
                }
            ],
            database: [
                { model: "User", fields: ["id String @id", "email String @unique", "fullName String", "avatarUrl String?"] },
                { model: "Activity", fields: ["id String @id", "type String", "payload Json", "createdAt DateTime"] },
                { model: "Setting", fields: ["id String @id", "userId String", "key String", "value String"] }
            ],
            apiRoutes: []
        };
    }

    // Web Fallback
    return {
        name: appName,
        description: `A modern ${framework} web application with a scalable architecture.`,
        stack: [framework, "Tailwind CSS", "Prisma", "Lucide React", "Supabase"],
        pages: [
            { 
                name: "Home", 
                description: "Landing page designed to convert visitors.", 
                components: ["HeroSection", "FeatureGrid", "Testimonials", "CallToAction"] 
            },
            { 
                name: "Dashboard", 
                description: "Authenticated user overview.", 
                components: ["Sidebar", "StatsCards", "ChartArea", "RecentTable"] 
            },
            { 
                name: "Settings", 
                description: "Account configuration page.", 
                components: ["ProfileForm", "SecuritySettings", "BillingPortal"] 
            }
        ],
        database: [
            { model: "User", fields: ["id String @id", "email String @unique", "name String?", "role String @default('user')"] },
            { model: "Subscription", fields: ["id String @id", "userId String", "status String", "planId String"] },
            { model: "AuditLog", fields: ["id String @id", "action String", "userId String", "timestamp DateTime"] }
        ],
        apiRoutes: [
            { method: "GET", path: "/api/me", description: "Get current user profile" },
            { method: "POST", path: "/api/auth/login", description: "Authenticate user" },
            { method: "POST", path: "/api/billing/create-portal", description: "Create Stripe billing portal session" }
        ]
    };
  }
}

// --- SHARED COMPONENTS ---

const Header = ({ onViewChange, currentView, settings }: { onViewChange: (v: string) => void, currentView: string, settings: AppSettings }) => (
  <nav className="flex items-center justify-between px-8 py-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
    <div className="flex items-center gap-2 cursor-pointer" onClick={() => onViewChange('home')}>
      <Rocket className="w-6 h-6" style={{ color: settings.primaryColor }} />
      <span className="font-bold text-xl tracking-tight text-white">
        {settings.appName.replace("AI", "")}
        <span style={{ color: settings.primaryColor }}>AI</span>
      </span>
    </div>
    <div className="flex items-center gap-6 text-sm font-medium text-slate-400">
      <button onClick={() => onViewChange('templates')} className={`hover:text-white transition ${currentView === 'templates' ? 'text-white' : ''}`}>Templates</button>
      <button onClick={() => onViewChange('docs')} className={`hover:text-white transition ${currentView === 'docs' ? 'text-white' : ''}`}>Docs</button>
      <button onClick={() => onViewChange('admin-dash')} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-full border border-slate-700 transition flex items-center gap-2">
        <Lock className="w-3 h-3" />
        Admin Panel
      </button>
    </div>
  </nav>
);

const FileTreeItem: React.FC<{ 
  name: string, 
  isFolder?: boolean, 
  open?: boolean, 
  onClick?: () => void,
  isSelected?: boolean,
  children?: React.ReactNode 
}> = ({ name, isFolder = false, open = false, onClick, isSelected, children }) => {
  const [isOpen, setIsOpen] = useState(open);

  return (
    <div className="select-none">
      <div 
        className={`flex items-center gap-1.5 py-1 hover:bg-slate-800/50 cursor-pointer rounded px-2 ${isSelected ? 'bg-blue-500/20 text-blue-400' : ''}`}
        onClick={(e) => {
           if (isFolder) {
             e.stopPropagation();
             setIsOpen(!isOpen);
           } else if (onClick) {
             onClick();
           }
        }}
      >
        <div className={`text-slate-600 transition-transform ${isOpen ? 'rotate-90' : ''} ${!isFolder && 'invisible'}`}>
           <ChevronRight className="w-3 h-3" />
        </div>
        {isFolder ? <Layers className="w-3.5 h-3.5 text-blue-400" /> : <FileCode className="w-3.5 h-3.5 text-slate-500" />}
        <span className={`truncate ${isFolder ? "text-slate-300 font-medium" : "text-slate-400"}`}>{name}</span>
      </div>
      {isOpen && children && (
        <div className="pl-2 ml-2.5 border-l border-slate-800/50">
          {children}
        </div>
      )}
    </div>
  );
};

const SyntaxHighlighter = ({ code }: { code: string }) => {
  // Simple regex-based syntax highlighting for demo purposes
  const keywords = ['import', 'from', 'export', 'default', 'function', 'return', 'const', 'interface', 'type', 'async', 'await', 'CREATE', 'TABLE', 'INSERT', 'INTO', 'VALUES', 'PRIMARY', 'KEY', 'TEXT', 'BOOLEAN', 'TIMESTAMP'];
  const types = ['React', 'useState', 'useEffect', 'string', 'number', 'boolean', 'void', 'Promise', 'Metadata'];
  const components = ['div', 'span', 'h1', 'p', 'button', 'input', 'form', 'View', 'Text', 'StyleSheet', 'SafeAreaView', 'TouchableOpacity', 'Image'];
  
  const lines = code.split('\n');
  
  return (
    <div className="font-mono text-sm leading-6">
      {lines.map((line, i) => {
        let formattedLine: React.ReactNode[] = [];
        let cursor = 0;
        
        // Very basic tokenization by splitting on spaces and common punctuation (kept simple)
        const parts = line.split(/(\s+|[{}();,<>=:])/);
        
        parts.forEach((part, idx) => {
           if (keywords.includes(part)) {
             formattedLine.push(<span key={idx} className="text-purple-400 font-semibold">{part}</span>);
           } else if (types.includes(part)) {
             formattedLine.push(<span key={idx} className="text-yellow-300">{part}</span>);
           } else if (components.includes(part)) {
             formattedLine.push(<span key={idx} className="text-blue-300">{part}</span>);
           } else if (part.startsWith('"') || part.startsWith("'") || part.startsWith('`')) {
              formattedLine.push(<span key={idx} className="text-green-400">{part}</span>);
           } else if (part.startsWith('//') || part.startsWith('#') || part.startsWith('--')) {
              formattedLine.push(<span key={idx} className="text-slate-500 italic">{part}</span>);
           } else {
             formattedLine.push(<span key={idx} className="text-slate-300">{part}</span>);
           }
        });

        return (
          <div key={i} className="table-row">
            <span className="table-cell text-right pr-4 text-slate-600 select-none w-8 text-xs">{i + 1}</span>
            <span className="table-cell whitespace-pre">{formattedLine}</span>
          </div>
        );
      })}
    </div>
  );
};


// --- ADMIN VIEWS ---

const AdminSidebar = ({ currentView, onViewChange, settings }: { currentView: string, onViewChange: (v: string) => void, settings: AppSettings }) => (
  <div className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col h-screen sticky top-0">
    <div className="p-6 border-b border-slate-800 flex items-center gap-2 cursor-pointer" onClick={() => onViewChange('home')}>
      <Shield className="w-5 h-5" style={{ color: settings.primaryColor }} />
      <span className="font-bold text-lg text-white">Super Admin</span>
    </div>
    <div className="flex-1 py-4 flex flex-col gap-1 px-3">
      {[
        { id: 'admin-dash', icon: BarChart3, label: 'Overview' },
        { id: 'admin-users', icon: Users, label: 'User Management' },
        { id: 'admin-tasks', icon: CheckSquare, label: 'Tasks' },
        { id: 'admin-ai', icon: Cpu, label: 'AI Providers' },
        { id: 'admin-billing', icon: CreditCard, label: 'Billing & Plans' },
        { id: 'admin-settings', icon: Settings, label: 'Settings' },
      ].map((item) => (
        <button 
          key={item.id} 
          onClick={() => onViewChange(item.id)}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition text-sm font-medium text-left ${
            currentView === item.id 
              ? 'bg-slate-800 text-white' 
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
          }`}
        >
          <item.icon className="w-4 h-4" />
          {item.label}
        </button>
      ))}
    </div>
    <div className="p-4 border-t border-slate-800">
        <button onClick={() => onViewChange('home')} className="flex items-center gap-2 text-slate-500 hover:text-white text-xs w-full px-2">
          <Rocket className="w-3 h-3" /> Back to App
        </button>
    </div>
  </div>
);

const AdminDashboard = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-white mb-6">Platform Overview</h1>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
       {[
         { label: "Total Users", val: "12,405", icon: Users, color: "text-blue-400" },
         { label: "Apps Deployed", val: "8,230", icon: Globe, color: "text-green-400" },
         { label: "Revenue (MRR)", val: "$45,200", icon: CreditCard, color: "text-purple-400" },
         { label: "AI Tokens/Day", val: "1.2M", icon: Zap, color: "text-yellow-400" },
       ].map((stat, i) => (
         <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <div className="flex justify-between items-start mb-4">
               <div className={`p-2 rounded-lg bg-slate-800 ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
               </div>
               <span className="text-xs text-green-500 font-medium">+12%</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stat.val}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
         </div>
       ))}
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
       <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-80">
          <h3 className="font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-4">
             {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center gap-4">
                   <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                   <div className="text-sm text-slate-300">User <span className="text-white font-medium">Alice</span> deployed <span className="text-white font-medium">CryptoDash</span> to Vercel.</div>
                   <div className="ml-auto text-xs text-slate-500">2m ago</div>
                </div>
             ))}
          </div>
       </div>
       <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-80">
          <h3 className="font-semibold text-white mb-4">System Health</h3>
          <div className="space-y-4">
             <div className="flex justify-between text-sm text-slate-400 mb-1">
                <span>API Latency</span>
                <span className="text-green-400">45ms</span>
             </div>
             <div className="w-full bg-slate-800 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full w-[20%]"></div></div>
             
             <div className="flex justify-between text-sm text-slate-400 mb-1 mt-4">
                <span>Database Load</span>
                <span className="text-yellow-400">62%</span>
             </div>
             <div className="w-full bg-slate-800 rounded-full h-2"><div className="bg-yellow-500 h-2 rounded-full w-[62%]"></div></div>

             <div className="flex justify-between text-sm text-slate-400 mb-1 mt-4">
                <span>AI Quota (Gemini)</span>
                <span className="text-blue-400">45%</span>
             </div>
             <div className="w-full bg-slate-800 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full w-[45%]"></div></div>
          </div>
       </div>
    </div>
  </div>
);

const AdminUsers = () => (
  <div className="p-8">
     <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center gap-2">
           <Plus className="w-4 h-4" /> Invite User
        </button>
     </div>
     <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
           <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-500 uppercase">
                 <th className="p-4">Name</th>
                 <th className="p-4">Role</th>
                 <th className="p-4">Status</th>
                 <th className="p-4">Plan</th>
                 <th className="p-4 text-right">Actions</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-800">
              {MOCK_USERS.map(user => (
                 <tr key={user.id} className="hover:bg-slate-800/50 transition">
                    <td className="p-4">
                       <div className="font-medium text-white">{user.name}</div>
                       <div className="text-xs text-slate-500">{user.email}</div>
                    </td>
                    <td className="p-4">
                       <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300">
                          {user.role}
                       </span>
                    </td>
                    <td className="p-4">
                       <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                       }`}>
                          {user.status}
                       </span>
                    </td>
                    <td className="p-4 text-sm text-slate-300 capitalize">{user.plan}</td>
                    <td className="p-4 text-right">
                       <button className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded"><MoreVertical className="w-4 h-4" /></button>
                    </td>
                 </tr>
              ))}
           </tbody>
        </table>
     </div>
  </div>
);

const AdminTasks = () => {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Partial<Task>>({ status: 'todo', priority: 'medium' });
  const [isEditing, setIsEditing] = useState(false);

  const handleOpenAdd = () => {
    setCurrentTask({ status: 'todo', priority: 'medium', title: '', assignee: 'Admin User' });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setCurrentTask({ ...task });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSaveTask = () => {
    if (!currentTask.title) return;
    
    if (isEditing && currentTask.id) {
       setTasks(tasks.map(t => t.id === currentTask.id ? { ...currentTask, id: t.id } as Task : t));
    } else {
       const task: Task = {
         id: Math.random().toString(36).substr(2, 9),
         title: currentTask.title,
         assignee: currentTask.assignee || 'Admin User',
         status: currentTask.status || 'todo',
         priority: currentTask.priority || 'medium',
         dueDate: currentTask.dueDate || new Date().toISOString().split('T')[0]
       };
       setTasks([...tasks, task]);
    }
    setIsModalOpen(false);
  };

  const toggleStatus = (id: string) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        return { ...t, status: t.status === 'done' ? 'todo' : 'done' };
      }
      return t;
    }));
  };

  const handleDelete = (id: string) => {
    if(confirm('Delete this task?')) {
       setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const getPriorityColor = (p: string) => {
     switch(p) {
        case 'high': return 'bg-red-500/10 text-red-500';
        case 'medium': return 'bg-yellow-500/10 text-yellow-500';
        case 'low': return 'bg-blue-500/10 text-blue-500';
        default: return 'bg-slate-500/10 text-slate-500';
     }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Task Management</h1>
        <button onClick={handleOpenAdd} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      {isModalOpen && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl animate-accordion-down">
               <h3 className="text-lg font-bold text-white mb-4">{isEditing ? 'Edit Task' : 'Create New Task'}</h3>
               <div className="space-y-4">
                  <div>
                     <label className="text-xs text-slate-400 block mb-1">Title</label>
                     <input 
                       type="text" 
                       className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm outline-none focus:border-primary"
                       value={currentTask.title || ''}
                       onChange={e => setCurrentTask({...currentTask, title: e.target.value})}
                       placeholder="Enter task title"
                       autoFocus
                     />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs text-slate-400 block mb-1">Assignee</label>
                        <input 
                          type="text" 
                          className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm outline-none focus:border-primary"
                          value={currentTask.assignee || ''}
                          onChange={e => setCurrentTask({...currentTask, assignee: e.target.value})}
                          placeholder="Assignee"
                        />
                     </div>
                     <div>
                        <label className="text-xs text-slate-400 block mb-1">Due Date</label>
                        <input 
                          type="date" 
                          className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm outline-none focus:border-primary"
                          value={currentTask.dueDate || ''}
                          onChange={e => setCurrentTask({...currentTask, dueDate: e.target.value})}
                        />
                     </div>
                  </div>
                  <div>
                     <label className="text-xs text-slate-400 block mb-1">Priority</label>
                     <div className="flex gap-2">
                        {['low', 'medium', 'high'].map(p => (
                           <button 
                             key={p} 
                             onClick={() => setCurrentTask({...currentTask, priority: p as any})}
                             className={`px-3 py-1.5 rounded text-xs capitalize border ${currentTask.priority === p ? 'bg-primary border-primary text-white' : 'bg-slate-950 border-slate-700 text-slate-400'}`}
                           >
                              {p}
                           </button>
                        ))}
                     </div>
                  </div>
               </div>
               <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                  <button onClick={handleSaveTask} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium">{isEditing ? 'Update' : 'Create'}</button>
               </div>
            </div>
         </div>
      )}

      <div className="space-y-3">
         {tasks.length === 0 && (
            <div className="text-center py-10 text-slate-500">No tasks found. Create one to get started.</div>
         )}
         {tasks.map(task => (
           <div key={task.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between group hover:border-slate-700 transition">
              <div className="flex items-center gap-4">
                 <button onClick={() => toggleStatus(task.id)} className={`w-6 h-6 rounded border flex items-center justify-center transition ${task.status === 'done' ? 'bg-green-500 border-green-500 text-white' : 'border-slate-600 hover:border-slate-500 text-transparent'}`}>
                    <Check className="w-4 h-4" />
                 </button>
                 <div>
                    <h4 className={`font-medium ${task.status === 'done' ? 'text-slate-500 line-through' : 'text-white'}`}>{task.title}</h4>
                    <div className="flex items-center gap-4 mt-1">
                       <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Users className="w-3 h-3" /> {task.assignee}
                       </div>
                       <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar className="w-3 h-3" /> {task.dueDate}
                       </div>
                    </div>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                 </span>
                 <div className="flex items-center opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => handleOpenEdit(task)} className="text-slate-500 hover:text-white p-2">
                       <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(task.id)} className="text-slate-500 hover:text-red-400 p-2">
                       <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
};

const AdminProviders = ({ providers, onUpdate }: { providers: ProviderConfig[], onUpdate: (p: ProviderConfig[]) => void }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempKey, setTempKey] = useState("");

  const handleEdit = (p: ProviderConfig) => {
    setEditingId(p.id);
    setTempKey(p.apiKey || "");
  };

  const handleSave = (id: string) => {
    onUpdate(providers.map(p => p.id === id ? { ...p, apiKey: tempKey } : p));
    setEditingId(null);
    setTempKey("");
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">AI & Service Providers</h1>
      <div className="grid grid-cols-1 gap-4">
        {providers.map(p => (
           <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                 <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                    p.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-slate-800 text-slate-500'
                 }`}>
                    {p.name[0]}
                 </div>
                 <div>
                    <h3 className="font-semibold text-white flex items-center gap-2">
                       {p.name}
                       {p.status === 'inactive' && <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-500">Inactive</span>}
                    </h3>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                       <span>Type: {p.type}</span>
                       <span>•</span>
                       <span>Priority: {p.priority}</span>
                    </div>
                 </div>
              </div>
              
              <div className="flex items-center gap-4 w-full md:w-auto">
                 {editingId === p.id ? (
                   <div className="flex items-center gap-2 w-full md:w-auto">
                      <input 
                        type="text" 
                        value={tempKey}
                        onChange={(e) => setTempKey(e.target.value)}
                        placeholder="Paste API Key"
                        className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm text-white focus:border-primary outline-none min-w-[200px]"
                      />
                      <button onClick={() => handleSave(p.id)} className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-white px-2">Cancel</button>
                   </div>
                 ) : (
                   <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-right hidden md:block">
                         <div className="text-xs text-slate-500 mb-1">Usage Quota</div>
                         <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${p.usage}%` }}></div>
                         </div>
                      </div>
                      <div className="flex gap-2">
                         <button 
                           onClick={() => handleEdit(p)}
                           className="px-3 py-1.5 rounded-md bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 hover:text-white transition flex items-center gap-2"
                         >
                            <Code className="w-3.5 h-3.5" />
                            {p.apiKey ? 'Update Key' : 'Add Key'}
                         </button>
                         <button className="p-2 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white">
                            <Settings className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                 )}
              </div>
           </div>
        ))}
      </div>
    </div>
  );
};

const AdminSettingsView = ({ settings, onUpdate }: { settings: AppSettings, onUpdate: (s: AppSettings) => void }) => {
   const [localSettings, setLocalSettings] = useState(settings);

   const handleSave = () => {
      onUpdate(localSettings);
      alert("Branding settings updated!");
   };

   return (
      <div className="p-8 max-w-2xl">
         <h1 className="text-2xl font-bold text-white mb-6">Settings & Branding</h1>
         
         <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
               <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Palette className="w-4 h-4" /> Brand Identity
               </h3>
               
               <div className="space-y-4">
                  <div>
                     <label className="block text-sm text-slate-400 mb-1">Application Name</label>
                     <input 
                        type="text" 
                        value={localSettings.appName}
                        onChange={(e) => setLocalSettings({...localSettings, appName: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-primary outline-none transition"
                     />
                  </div>
                  
                  <div>
                     <label className="block text-sm text-slate-400 mb-1">Primary Color</label>
                     <div className="flex items-center gap-3">
                        <input 
                           type="color" 
                           value={localSettings.primaryColor}
                           onChange={(e) => setLocalSettings({...localSettings, primaryColor: e.target.value})}
                           className="h-10 w-20 bg-transparent cursor-pointer rounded overflow-hidden"
                        />
                        <div className="text-sm text-slate-500 font-mono">{localSettings.primaryColor}</div>
                     </div>
                  </div>
               </div>

               <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end">
                  <button 
                     onClick={handleSave}
                     className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:opacity-90 transition"
                     style={{ backgroundColor: localSettings.primaryColor }}
                  >
                     Save Changes
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
};

// --- BUILDER COMPONENTS ---

// Fix: Make children optional in props type definition to resolve TS error
const MobileFrame = ({ children, isHome, onBack }: { children?: React.ReactNode, isHome?: boolean, onBack?: () => void }) => (
    <div className="max-w-[360px] mx-auto h-[700px] bg-[#000] rounded-[3rem] p-3 shadow-2xl relative border-4 border-slate-800 ring-4 ring-black">
      {/* Dynamic Island / Notch */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 h-7 w-28 bg-black rounded-full z-30 flex justify-center items-center">
         <div className="w-20 h-5 bg-black rounded-full"></div>
      </div>
      {/* Screen */}
      <div className="w-full h-full bg-white rounded-[2.2rem] overflow-hidden flex flex-col relative text-slate-900 z-10">
         {/* Status Bar */}
         <div className="h-12 bg-transparent flex justify-between items-center px-6 pt-3 select-none z-20 shrink-0 absolute top-0 w-full text-black font-semibold">
            <span className="text-xs">9:41</span>
            <div className="flex gap-1.5">
               <Signal className="w-3.5 h-3.5" />
               <Wifi className="w-3.5 h-3.5" />
               <Battery className="w-3.5 h-3.5" />
            </div>
         </div>
         {/* Back Button for non-home screens */}
         {!isHome && onBack && (
            <div className="absolute top-12 left-4 z-20">
               <button onClick={onBack} className="p-2 bg-white/80 backdrop-blur rounded-full shadow-sm">
                  <ArrowLeft className="w-5 h-5 text-slate-900" />
               </button>
            </div>
         )}
         <div className="flex-1 overflow-hidden flex flex-col pt-12">
            {children}
         </div>
         {/* Home Bar */}
         <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-slate-900 rounded-full opacity-40 z-30"></div>
      </div>
    </div>
  );

  // Fix: Make children optional in props type definition to resolve TS error
  const WebFrame = ({ children, spec, settings, activeRoute, onNavigate }: { children?: React.ReactNode, spec: GeneratedAppSpec, settings: AppSettings, activeRoute: string, onNavigate: (r: string) => void }) => (
     <div className="w-full h-full bg-white rounded-lg border border-slate-800 shadow-2xl overflow-hidden flex flex-col text-slate-900">
        {/* Browser Chrome */}
        <div className="bg-slate-100 border-b border-slate-200 p-3 flex items-center gap-4 flex-shrink-0">
             <div className="flex gap-1.5 ml-1">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
             </div>
             <div className="flex gap-2">
                 <button onClick={() => onNavigate('home')} className="p-1 hover:bg-slate-200 rounded text-slate-500">
                    <Home className="w-4 h-4" />
                 </button>
             </div>
             <div className="flex-1 bg-white border border-slate-300 rounded-md px-4 py-1.5 text-xs text-slate-600 flex items-center shadow-sm font-mono truncate">
                <Lock className="w-3 h-3 mr-2 text-green-600" />
                https://{spec.name.toLowerCase().replace(/\s+/g, '-')}.{settings.appName.toLowerCase().replace(/\s+/g, '')}.com{activeRoute !== 'home' ? `/${activeRoute}` : ''}
             </div>
        </div>
        <div className="flex-1 overflow-auto relative flex flex-col">
           {children}
        </div>
     </div>
  );

  const Content = ({ spec, settings, isMobile, activeRoute, onNavigate }: { spec: GeneratedAppSpec, settings: AppSettings, isMobile: boolean, activeRoute: string, onNavigate: (route: string) => void }) => {
     // Render Home Page
     if (activeRoute === 'home') {
        return (
           <div className="h-full flex flex-col font-sans bg-slate-50">
              {/* Mock App Header */}
              {!isMobile && (
                  <header className={`px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 flex justify-between items-center z-10 sticky top-0`}>
                     <div className={`font-bold text-xl tracking-tight text-slate-900 cursor-pointer`} onClick={() => onNavigate('home')}>{spec.name}</div>
                     <div className="flex gap-6 text-sm font-medium text-slate-600">
                        {spec.pages.slice(0, 3).map(p => (
                           <span key={p.name} onClick={() => onNavigate(p.name)} className="hover:text-blue-600 cursor-pointer">{p.name}</span>
                        ))}
                     </div>
                     <button className="text-white px-4 py-1.5 rounded-full text-xs font-bold" style={{ backgroundColor: settings.primaryColor }}>
                       Sign In
                     </button>
                  </header>
              )}
              
              <main className={`flex-1 overflow-y-auto ${isMobile ? 'no-scrollbar' : ''}`} style={isMobile ? { scrollbarWidth: 'none' } : {}}>
                 <section className={`${isMobile ? 'py-6 px-4 pt-4' : 'py-20 px-6'} text-center ${!isMobile && 'bg-gradient-to-b from-slate-50 to-white'}`}>
                    {!isMobile && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider border border-blue-100 mb-4">
                           New Release v1.0
                        </div>
                    )}
                    <h1 className={`${isMobile ? 'text-2xl mt-4' : 'text-5xl'} font-extrabold text-slate-900 leading-tight mb-4`}>
                       {spec.name} is <span style={{ color: settings.primaryColor }}>here</span>.
                    </h1>
                    <p className={`${isMobile ? 'text-sm' : 'text-lg'} text-slate-600 max-w-xl mx-auto leading-relaxed mb-6`}>
                       {spec.description}
                    </p>
                    <div className="flex items-center justify-center gap-3">
                       <button onClick={() => onNavigate(spec.pages[0]?.name || 'home')} className="px-6 py-3 text-white rounded-full font-bold text-sm shadow-lg w-full md:w-auto" style={{ backgroundColor: settings.primaryColor }}>
                          Get Started
                       </button>
                    </div>
                 </section>
                 
                 <section className={`${isMobile ? 'py-4 px-4' : 'py-20 px-6'} bg-transparent`}>
                    <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-slate-900 mb-4 ${isMobile ? 'text-left' : 'text-center'}`}>Discover</h2>
                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-3 gap-6'}`}>
                        {spec.pages.map((page, idx) => (
                           <div key={idx} onClick={() => onNavigate(page.name)} className={`p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition cursor-pointer flex items-center gap-4 ${isMobile ? 'flex-row' : 'flex-col text-center'}`}>
                              <div className={`w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0`} style={{ color: settings.primaryColor }}>
                                 <Layout className="w-5 h-5" />
                              </div>
                              <div>
                                 <h3 className="font-bold text-slate-900 text-sm md:text-base">{page.name}</h3>
                                 <p className="text-xs text-slate-500 line-clamp-1">{page.description}</p>
                              </div>
                              {isMobile && <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />}
                           </div>
                        ))}
                    </div>
                 </section>
              </main>
              
              {isMobile && (
                 <div className="h-16 border-t border-slate-100 flex justify-around items-center px-4 bg-white/90 backdrop-blur shrink-0 pb-2">
                    <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => onNavigate('home')}>
                        <Home className="w-6 h-6 text-slate-900" />
                        <span className="text-[10px] font-medium text-slate-900">Home</span>
                    </div>
                    {spec.pages.slice(0, 3).map((p, i) => (
                       <div key={i} className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => onNavigate(p.name)}>
                          <div className={`w-6 h-6 rounded-md bg-slate-200`}></div>
                          <span className="text-[10px] font-medium text-slate-400">{p.name.slice(0,5)}</span>
                       </div>
                    ))}
                 </div>
              )}
           </div>
        );
     } 
     
     // Render Specific Page
     const page = spec.pages.find(p => p.name === activeRoute);
     return (
        <div className="h-full flex flex-col font-sans bg-white">
           {!isMobile && (
               <header className={`px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10`}>
                    <div className="flex items-center gap-2">
                       <div className="font-bold text-xl text-slate-900 cursor-pointer" onClick={() => onNavigate('home')}>{spec.name}</div>
                       <ChevronRight className="w-4 h-4 text-slate-400" />
                       <div className="font-semibold text-slate-900">{page?.name}</div>
                    </div>
                    <button className="text-sm font-medium text-slate-500 hover:text-slate-900" onClick={() => onNavigate('home')}>Back Home</button>
               </header>
           )}
           <main className={`flex-1 overflow-y-auto ${isMobile ? 'p-4 no-scrollbar' : 'p-6'}`} style={isMobile ? { scrollbarWidth: 'none' } : {}}>
              <h2 className={`${isMobile ? 'text-2xl mt-2' : 'text-3xl'} font-bold text-slate-900 mb-2`}>{page?.name}</h2>
              <p className="text-slate-500 mb-8 text-sm leading-relaxed">{page?.description}</p>
              
              {/* Mock Components */}
              <div className="space-y-4">
                  {page?.components.map((comp, idx) => (
                     <div key={idx} className="p-4 border border-slate-100 rounded-2xl bg-slate-50 shadow-sm">
                        <div className="text-[10px] font-mono text-slate-400 mb-2 uppercase tracking-wide opacity-50">{comp} Component</div>
                        <div className="h-24 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 text-sm">
                           Preview: {comp}
                        </div>
                     </div>
                  ))}
              </div>
           </main>
           {isMobile && (
              <div className="h-16 border-t border-slate-100 flex justify-around items-center px-4 bg-white/90 backdrop-blur shrink-0 pb-2">
                 <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => onNavigate('home')}>
                     <Home className="w-6 h-6 text-slate-400" />
                     <span className="text-[10px] font-medium text-slate-400">Home</span>
                 </div>
                 {spec.pages.slice(0, 3).map((p, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => onNavigate(p.name)}>
                       <div className={`w-6 h-6 rounded-md ${p.name === activeRoute ? 'bg-slate-900' : 'bg-slate-200'}`}></div>
                       <span className={`text-[10px] font-medium ${p.name === activeRoute ? 'text-slate-900' : 'text-slate-400'}`}>{p.name.slice(0,5)}</span>
                    </div>
                 ))}
              </div>
           )}
        </div>
     );
  };

const AppInteractivePreview = ({ spec, settings, platform }: { spec: GeneratedAppSpec, settings: AppSettings, platform: 'web' | 'mobile' }) => {
  const isMobile = platform === 'mobile';
  const [activeRoute, setActiveRoute] = useState('home');

  return isMobile ? (
     <div className="flex items-center justify-center h-full py-2">
       <MobileFrame isHome={activeRoute === 'home'} onBack={() => setActiveRoute('home')}>
          <Content spec={spec} settings={settings} isMobile={isMobile} activeRoute={activeRoute} onNavigate={setActiveRoute} />
       </MobileFrame>
     </div>
  ) : (
     <div className="h-full p-4">
       <WebFrame spec={spec} settings={settings} activeRoute={activeRoute} onNavigate={setActiveRoute}>
          <Content spec={spec} settings={settings} isMobile={isMobile} activeRoute={activeRoute} onNavigate={setActiveRoute} />
       </WebFrame>
     </div>
  );
};

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  type: 'text' | 'status-list';
  content: string;
  items?: { label: string; status: 'pending' | 'running' | 'completed' }[];
  timestamp: Date;
}

const BuilderChatInterface = ({ config, onViewChange, settings, apiKey }: { config: BuilderConfig, onViewChange: (v: string) => void, settings: AppSettings, apiKey?: string }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'integrations'>('preview');
  const [spec, setSpec] = useState<GeneratedAppSpec | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [buildStep, setBuildStep] = useState<'initial' | 'planning' | 'review' | 'building' | 'complete'>('initial');
  const [editingPage, setEditingPage] = useState<{ name: string; description: string } | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  
  // Preview State
  const [previewMode, setPreviewMode] = useState<'blueprint' | 'app'>('blueprint');

  // Code View State
  const [selectedFile, setSelectedFile] = useState<string | null>('schema.prisma');
  
  // Integration States
  const [integrations, setIntegrations] = useState({
     github: false,
     supabase: false,
     resend: false,
     twilio: false
  });
  const [apiKeys, setApiKeys] = useState({ resend: '', twilio: '' });
  const [repoUrl, setRepoUrl] = useState("");
  const [supabaseConfig, setSupabaseConfig] = useState<{url?: string, key?: string}>({});
  const [supabaseInputs, setSupabaseInputs] = useState({ url: '', key: '' });

  const aiService = useRef(new AppGeneratorService(apiKey));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update AI service when API Key changes
  useEffect(() => {
    aiService.current = new AppGeneratorService(apiKey);
  }, [apiKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (config.prompt && messages.length === 0) {
      handleInitialGeneration(config);
    }
  }, []);
  
  // Auto-switch to Live Preview when build is complete
  useEffect(() => {
     if (buildStep === 'complete') {
        setPreviewMode('app');
     }
  }, [buildStep]);

  const addMessage = (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, {
      ...msg,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date()
    }]);
  };

  const handleInitialGeneration = async (cfg: BuilderConfig) => {
    setBuildStep('planning');
    addMessage({ role: 'user', type: 'text', content: cfg.prompt });
    setIsGenerating(true);

    await new Promise(r => setTimeout(r, 600));
    const statusMsgId = Math.random().toString(36).substring(7);
    const stackLabel = `${cfg.platform === 'mobile' ? 'Mobile' : 'Web'} app using ${cfg.framework}`;
    
    setMessages(prev => [...prev, {
      id: statusMsgId,
      role: 'assistant',
      type: 'status-list',
      content: `I'm analyzing your request for a ${stackLabel}.`,
      items: [
        { label: "Analyzing requirements", status: "running" },
        { label: "Drafting database schema", status: "pending" },
        { label: "Designing UI components", status: "pending" },
        { label: "Generating API routes", status: "pending" }
      ],
      timestamp: new Date()
    }]);

    try {
      const generatedSpec = await aiService.current.generateAppSpec(cfg.prompt, cfg.platform, cfg.framework);
      
      const updateStatus = (index: number, status: 'completed' | 'running') => {
        setMessages(prev => prev.map(m => {
          if (m.id === statusMsgId && m.items) {
            const newItems = [...m.items];
            newItems[index].status = status;
            if (index + 1 < newItems.length && status === 'completed') {
               newItems[index + 1].status = 'running';
            }
            return { ...m, items: newItems };
          }
          return m;
        }));
      };

      await new Promise(r => setTimeout(r, 800));
      updateStatus(0, 'completed');
      await new Promise(r => setTimeout(r, 800));
      updateStatus(1, 'completed');
      await new Promise(r => setTimeout(r, 800));
      updateStatus(2, 'completed');
      await new Promise(r => setTimeout(r, 800));
      updateStatus(3, 'completed');

      setSpec(generatedSpec);
      setIsGenerating(false);
      setBuildStep('review');

      await new Promise(r => setTimeout(r, 500));
      addMessage({
        role: 'assistant',
        type: 'text',
        content: `I've drafted the initial plan for **${generatedSpec.name}**. \n\nPlease review the ${cfg.platform === 'mobile' ? 'Screens' : 'Pages'}, Database Schema, and API Routes on the right.\n\nIf everything looks good, click **Generate Code** to build the application.`
      });

    } catch (e) {
      console.error(e);
      setIsGenerating(false);
      addMessage({ role: 'assistant', type: 'text', content: "Sorry, I encountered an error generating the app. Please try again." });
    }
  };

  const handleApproveAndBuild = async () => {
    if (buildStep !== 'review') return;
    setBuildStep('building');
    addMessage({ role: 'user', type: 'text', content: "Looks good. Generate the code." });

    const statusMsgId = Math.random().toString(36).substring(7);
    setMessages(prev => [...prev, {
      id: statusMsgId,
      role: 'assistant',
      type: 'status-list',
      content: "Writing application code...",
      items: [
        { label: `Scaffolding ${config.framework} project`, status: "running" },
        { label: "Generating Prisma schema", status: "pending" },
        { label: "Creating API handlers", status: "pending" },
        { label: "Building React components", status: "pending" }
      ],
      timestamp: new Date()
    }]);

    const updateStatus = (index: number, status: 'completed' | 'running') => {
      setMessages(prev => prev.map(m => {
        if (m.id === statusMsgId && m.items) {
          const newItems = [...m.items];
          newItems[index].status = status;
          if (index + 1 < newItems.length && status === 'completed') {
             newItems[index + 1].status = 'running';
          }
          return { ...m, items: newItems };
        }
        return m;
      }));
    };

    await new Promise(r => setTimeout(r, 1200));
    updateStatus(0, 'completed');
    await new Promise(r => setTimeout(r, 1200));
    updateStatus(1, 'completed');
    await new Promise(r => setTimeout(r, 1200));
    updateStatus(2, 'completed');
    await new Promise(r => setTimeout(r, 1200));
    updateStatus(3, 'completed');

    setBuildStep('complete');
    setActiveTab('preview'); // Stay on preview but switch mode
    setPreviewMode('app');

    addMessage({ 
      role: 'assistant', 
      type: 'text', 
      content: "Code generation complete! You can now interact with the Live Preview on the right, explore the source code, or launch the application." 
    });
  };

  const handleLaunch = async () => {
    if (buildStep !== 'complete') return;
    setIsGenerating(true);
    addMessage({ role: 'assistant', type: 'text', content: "Initiating deployment to Vercel..." });
    
    await new Promise(r => setTimeout(r, 1500));
    const deployUrl = `https://${spec?.name.toLowerCase().replace(/\s+/g, '-')}.vercel.app`;
    
    addMessage({ 
      role: 'assistant', 
      type: 'text', 
      content: `🚀 **Deployment Successful!**\n\nYour app is live at: [${deployUrl}](${deployUrl})\n\nGlobal CDN propagation may take a few minutes.` 
    });
    setIsGenerating(false);
    window.open(deployUrl, '_blank');
  };

  const handleDownloadCode = () => {
    if (!spec) return;
    // Simulate creating a zip/downloading
    const element = document.createElement("a");
    const fileContent = JSON.stringify(spec, null, 2);
    const file = new Blob([fileContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${spec.name.toLowerCase().replace(/\s+/g, '-')}-source.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    addMessage({ role: 'assistant', type: 'text', content: "✅ Source code downloaded." });
  };
  
  const handleCopyCode = () => {
     if (!selectedFile) return;
     const code = generateFileContent(selectedFile);
     navigator.clipboard.writeText(code);
     // Optional: toast or feedback could be added here
     alert("Code copied to clipboard!");
  };

  const generateFileContent = (fileName: string): string => {
    if (!spec) return '';
    const isMobile = config.platform === 'mobile';

    // .env Generation for Real Backend realism
    if (fileName === '.env') {
       let envContent = `# Generated by HelloJadanAI\n\n`;
       if (integrations.supabase && supabaseConfig.url) {
          envContent += `DATABASE_URL="${supabaseConfig.url}"\nSUPABASE_KEY="${supabaseConfig.key}"\n\n`;
       } else {
          envContent += `DATABASE_URL="postgresql://user:password@localhost:5432/mydb"\n\n`;
       }
       
       if (integrations.resend && apiKeys.resend) {
          envContent += `RESEND_API_KEY="${apiKeys.resend}"\n`;
       }
       if (integrations.twilio && apiKeys.twilio) {
          envContent += `TWILIO_ACCOUNT_SID="${apiKeys.twilio}"\n`;
       }
       return envContent;
    }

    // GitHub Workflow realism
    if (fileName === '.github/workflows/deploy.yml') {
       return `name: Deploy to Vercel

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install Dependencies
        run: npm install
      - name: Deploy to Vercel
        run: npx vercel --prod --token=\${{ secrets.VERCEL_TOKEN }}
`;
    }

    // Supabase Migration SQL
    if (fileName === 'supabase/migrations/init.sql') {
       return `-- Generated SQL Migration\n\n` + spec.database.map(m => {
          return `CREATE TABLE "${m.model.toLowerCase()}" (\n` +
                 `  "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,\n` +
                 `  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n` +
                 m.fields.map(f => {
                   const [name, type] = f.split(' ');
                   let sqlType = 'TEXT';
                   if (type?.toLowerCase().includes('int')) sqlType = 'INTEGER';
                   if (type?.toLowerCase().includes('bool')) sqlType = 'BOOLEAN';
                   if (type?.toLowerCase().includes('date')) sqlType = 'TIMESTAMP';
                   return `  "${name.toLowerCase()}" ${sqlType}`;
                 }).join(',\n') +
                 `\n);`;
       }).join('\n\n');
    }

    if (fileName.endsWith('schema.prisma')) {
      return `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

${spec.database.map(m => `model ${m.model} {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  ${m.fields.map(f => f).join('\n  ')}
}`).join('\n\n')}
      `;
    }
    
    // Web Layout
    if (fileName.endsWith('layout.tsx')) {
        return `
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '${spec.name}',
  description: '${spec.description}',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
        `;
    }

    // Web Page
    if (fileName.includes('/page.tsx')) {
        const pageName = fileName.split('/')[0].replace(/-/g, ' ');
        const page = spec.pages.find(p => p.name.toLowerCase() === pageName) || spec.pages[0];
        
        return `
import React from 'react';
${page?.components.map(c => `import { ${c} } from '@/components/${c}';`).join('\n')}

export default function ${page?.name.replace(/\s/g, '')}Page() {
  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">${page?.name}</h1>
        <p className="text-slate-600 mb-8">${page?.description}</p>
        
        <div className="grid grid-cols-1 gap-6">
          ${page?.components.map(c => `<${c} />`).join('\n          ')}
        </div>
      </div>
    </main>
  );
}
        `;
    }

    // Mobile App Entry
    if (fileName === 'App.tsx') {
        return `
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
${spec.pages.map(p => `import ${p.name.replace(/\s/g, '')}Screen from './screens/${p.name.replace(/\s/g, '')}Screen';`).join('\n')}

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        ${spec.pages.map((p, i) => `<Stack.Screen name="${p.name}" component={${p.name.replace(/\s/g, '')}Screen} ${i === 0 ? 'options={{ title: "Home" }}' : ''} />`).join('\n        ')}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
        `;
    }

    // Mobile Screens
    if (fileName.includes('Screen.tsx')) {
        const screenName = fileName.replace('screens/', '').replace('Screen.tsx', '');
        const page = spec.pages.find(p => p.name.replace(/\s/g, '') === screenName) || spec.pages[0];
        
        return `
import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';

export default function ${screenName}Screen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>${page?.name}</Text>
        <Text style={styles.description}>${page?.description}</Text>
        
        {/* Generated Components */}
        ${page?.components.map(c => `
        <View style={styles.card}>
          <Text style={styles.cardTitle}>${c}</Text>
          <View style={styles.placeholder} />
        </View>`).join('')}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e293b',
  },
  description: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  placeholder: {
    height: 100,
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
  }
});
        `;
    }
    
    return `// Content for ${fileName}`;
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const val = input;
    setInput('');
    addMessage({ role: 'user', type: 'text', content: val });
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 1000));
    addMessage({ 
      role: 'assistant', 
      type: 'text', 
      content: "I've noted that request. Since this is a demo, I won't fully regenerate the code, but you can see how the conversational interface works!" 
    });
    setIsGenerating(false);
  };

  const handleOpenEditModal = (page: any) => {
    setEditingPage(page);
    setEditPrompt("");
  };

  const handleSubmitEdit = async () => {
    if (!editingPage || !editPrompt.trim()) return;
    const pageName = editingPage.name;
    const request = editPrompt;
    setEditingPage(null);
    setEditPrompt("");
    addMessage({ role: 'user', type: 'text', content: `Update the ${pageName} page: ${request}` });
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 1500));
    if (spec) {
       const updatedPages = spec.pages.map(p => 
         p.name === pageName ? { ...p, description: `${p.description} (Updated: ${request})` } : p
       );
       setSpec({ ...spec, pages: updatedPages });
    }
    addMessage({ 
      role: 'assistant', 
      type: 'text', 
      content: `I've updated the **${pageName}** design to include: "${request}". The preview has been refreshed.` 
    });
    setIsGenerating(false);
  };

  const handleConnectIntegration = async (service: 'github' | 'supabase' | 'resend' | 'twilio') => {
      if ((service === 'resend' || service === 'twilio') && !apiKeys[service]) {
          addMessage({ role: 'assistant', type: 'text', content: `Please enter a valid API key for ${service} first.` });
          return;
      }

      if (service === 'supabase' && (!supabaseInputs.url || !supabaseInputs.key)) {
         addMessage({ role: 'assistant', type: 'text', content: `Please paste your Supabase URL and Key to connect.` });
         return;
      }
      
      setIsGenerating(true);
      if (service === 'github') {
         addMessage({ role: 'assistant', type: 'text', content: "Connecting to GitHub..." });
         await new Promise(r => setTimeout(r, 1000));
         const repoName = spec?.name.toLowerCase().replace(/\s+/g, '-') || 'my-app';
         const newUrl = `https://github.com/user/${repoName}`;
         setRepoUrl(newUrl);
         setIntegrations(prev => ({...prev, github: true}));
         addMessage({ role: 'assistant', type: 'text', content: `Creating repository **${repoName}**...` });
         await new Promise(r => setTimeout(r, 1500));
         addMessage({ role: 'assistant', type: 'text', content: `✅ Successfully pushed code to **${newUrl}**` });
      } else if (service === 'supabase') {
         addMessage({ role: 'assistant', type: 'text', content: "Connecting to Supabase instance..." });
         await new Promise(r => setTimeout(r, 1500));
         
         // Store credentials
         setIntegrations(prev => ({...prev, supabase: true}));
         setSupabaseConfig({
            url: supabaseInputs.url,
            key: supabaseInputs.key
         });

         // Simulate SQL execution
         if (spec?.database) {
            addMessage({ role: 'assistant', type: 'text', content: `Executing Schema Migration...` });
            for (const model of spec.database) {
               await new Promise(r => setTimeout(r, 800));
               addMessage({ role: 'assistant', type: 'text', content: `Creating table: **${model.model}**...` });
            }
            addMessage({ role: 'assistant', type: 'text', content: `✅ Database schema deployed successfully.` });
         } else {
            addMessage({ role: 'assistant', type: 'text', content: "✅ Supabase connected." });
         }

      } else {
         addMessage({ role: 'assistant', type: 'text', content: `Configuring ${service}...` });
         await new Promise(r => setTimeout(r, 1000));
         setIntegrations(prev => ({...prev, [service]: true}));
         addMessage({ role: 'assistant', type: 'text', content: `✅ ${service.charAt(0).toUpperCase() + service.slice(1)} API Key configured.` });
      }
      setIsGenerating(false);
  };

  return (
    <div className="flex h-screen bg-[#0f1117] text-slate-300 overflow-hidden font-sans relative">
      {editingPage && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#151923] border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl animate-accordion-down">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4" style={{ color: settings.primaryColor }} />
                Edit {editingPage.name}
              </h3>
              <button onClick={() => setEditingPage(null)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-400 mb-4">Describe the changes you want to make to this page.</p>
              <textarea 
                className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-1 focus:border-transparent outline-none resize-none text-sm"
                style={{ "--tw-ring-color": settings.primaryColor } as React.CSSProperties}
                placeholder="e.g. Change the background color, add a button..."
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                autoFocus
              ></textarea>
            </div>
            <div className="p-4 border-t border-slate-700 flex justify-end gap-3 bg-slate-900/50 rounded-b-xl">
              <button onClick={() => setEditingPage(null)} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition">Cancel</button>
              <button onClick={handleSubmitEdit} disabled={!editPrompt.trim()} className="px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2" style={{ backgroundColor: settings.primaryColor }}>
                <Zap className="w-3.5 h-3.5" /> Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-[400px] flex flex-col border-r border-slate-800 bg-[#0B0D12]">
        <div className="h-14 border-b border-slate-800 flex items-center px-4 bg-[#0B0D12]">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onViewChange('home')}>
             <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                <Rocket className="w-4 h-4" style={{ color: settings.primaryColor }} />
             </div>
             <span className="font-semibold text-white tracking-tight">{settings.appName}</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
           {messages.map((msg) => (
             <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border ${
                  msg.role === 'user' ? 'bg-slate-800 border-slate-700' : 'bg-slate-800 border-slate-700'
                }`} style={msg.role === 'assistant' ? { borderColor: `${settings.primaryColor}40`, color: settings.primaryColor } : {}}>
                   {msg.role === 'user' ? <Users className="w-4 h-4 text-slate-400" /> : <Zap className="w-4 h-4" />}
                </div>
                <div className={`max-w-[85%] space-y-2`}>
                   <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-300">{msg.role === 'user' ? 'You' : settings.appName}</span>
                   </div>
                   {msg.type === 'text' && (
                     <div className={`p-3 rounded-xl text-sm leading-relaxed ${
                       msg.role === 'user' ? 'bg-slate-800 text-slate-200' : 'text-slate-400'
                     }`}>
                       {msg.content}
                     </div>
                   )}
                   {msg.type === 'status-list' && msg.items && (
                     <div className="bg-[#151923] rounded-xl border border-slate-800 overflow-hidden">
                        <div className="p-3 border-b border-slate-800/50 text-sm text-slate-300 font-medium">{msg.content}</div>
                        <div className="p-2 space-y-1">
                          {msg.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 px-3 py-2 rounded hover:bg-white/5 transition">
                               {item.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                               {item.status === 'running' && <Loader2 className="w-4 h-4 animate-spin" style={{ color: settings.primaryColor }} />}
                               {item.status === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-slate-700" />}
                               <span className={`text-sm ${item.status === 'completed' ? 'text-slate-400' : 'text-slate-200'}`}>{item.label}</span>
                            </div>
                          ))}
                        </div>
                     </div>
                   )}
                </div>
             </div>
           ))}
           <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t border-slate-800 bg-[#0B0D12]">
          {buildStep === 'review' && (
             <button onClick={handleApproveAndBuild} className="w-full mb-3 text-white font-semibold py-2.5 rounded-lg transition shadow-lg flex items-center justify-center gap-2 hover:opacity-90" style={{ backgroundColor: '#16a34a' }}>
               <PlayCircle className="w-4 h-4" /> Generate Code
             </button>
          )}
          <div className="relative bg-[#1A1D24] rounded-xl border border-slate-700/50 transition shadow-lg">
             <textarea 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
               placeholder="Ask me..." 
               className="w-full bg-transparent border-none text-slate-200 text-sm p-3 focus:ring-0 resize-none h-14 placeholder-slate-500 outline-none"
             />
             <div className="flex justify-between items-center px-2 pb-2">
                <div className="flex gap-1 text-slate-500">
                   <button className="p-1.5 hover:bg-slate-700 rounded transition"><Paperclip className="w-4 h-4" /></button>
                </div>
                <button onClick={handleSendMessage} disabled={!input.trim() || isGenerating} className="p-1.5 text-white rounded hover:opacity-90 transition disabled:opacity-50" style={{ backgroundColor: settings.primaryColor }}>
                  <Send className="w-4 h-4" />
                </button>
             </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-[#0f1117] relative">
        <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-[#0f1117]">
           <div className="flex items-center gap-4">
              <span className="font-semibold text-white">{spec?.name || 'New Project'}</span>
              <div className="h-4 w-px bg-slate-800"></div>
              <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                 {['preview', 'code', 'integrations'].map((tab) => {
                    const isDisabled = (tab === 'code' || tab === 'integrations') && (buildStep === 'review' || buildStep === 'planning' || buildStep === 'initial');
                    return (
                      <button key={tab} onClick={() => !isDisabled && setActiveTab(tab as any)} disabled={isDisabled} className={`px-3 py-1.5 text-xs font-medium rounded-md transition capitalize flex items-center gap-2 ${activeTab === tab ? 'bg-slate-800 text-white shadow-sm' : isDisabled ? 'text-slate-600 cursor-not-allowed' : 'text-slate-500 hover:text-slate-300'}`}>
                        {tab} {isDisabled && <Lock className="w-3 h-3 opacity-50" />}
                      </button>
                    )
                 })}
              </div>
           </div>
           <div className="flex items-center gap-3">
              {buildStep === 'review' ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-medium">
                   <AlertTriangle className="w-3.5 h-3.5" /> Reviewing Plan
                </div>
              ) : null}
              {activeTab === 'code' && (
                <button 
                  onClick={handleDownloadCode} 
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5" /> Download Source
                </button>
              )}
              <button 
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition shadow-sm ${buildStep === 'review' ? 'bg-green-600 text-white hover:bg-green-700' : 'text-slate-900 bg-white hover:bg-slate-200'}`} 
                onClick={() => buildStep === 'review' ? handleApproveAndBuild() : handleLaunch()}
              >
                 {buildStep === 'review' ? <><Check className="w-3.5 h-3.5" /> Generate Code</> : <><Rocket className="w-3.5 h-3.5" /> Launch</>}
              </button>
           </div>
        </div>
        <div className="flex-1 overflow-auto p-0 relative">
           {isGenerating && !spec ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-8 h-8 animate-spin mb-4" style={{ color: settings.primaryColor }} />
                <h3 className="text-xl font-medium text-white mb-2">I'm generating the preview.</h3>
                <p className="text-slate-500 text-sm">Hold on for a moment.</p>
             </div>
           ) : spec ? (
             <>
                {activeTab === 'preview' && (
                  <div className="h-full flex flex-col">
                     {/* Preview Mode Toggle */}
                     <div className="px-8 pt-6 pb-2">
                        <div className="bg-slate-900 inline-flex rounded-lg p-1 border border-slate-800">
                           <button 
                              onClick={() => setPreviewMode('blueprint')}
                              className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-2 ${previewMode === 'blueprint' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                           >
                              <Layout className="w-3.5 h-3.5" /> Blueprint
                           </button>
                           <button 
                              onClick={() => setPreviewMode('app')}
                              className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-2 ${previewMode === 'app' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                           >
                              {config.platform === 'mobile' ? <Smartphone className="w-3.5 h-3.5" /> : <Laptop className="w-3.5 h-3.5" />} Live App
                           </button>
                        </div>
                     </div>

                     {/* Content Area */}
                     <div className="flex-1 overflow-auto p-8 pt-4">
                        {previewMode === 'blueprint' && (
                           <div className="max-w-5xl mx-auto animate-accordion-down">
                              <div className="mb-8">
                                <h1 className="text-2xl font-bold text-white mb-2">{spec.name}</h1>
                                <p className="text-slate-400">{spec.description}</p>
                              </div>
                              {buildStep === 'review' && (
                                 <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
                                    <Eye className="w-5 h-5 text-blue-400 mt-1" />
                                    <div>
                                       <h3 className="text-sm font-bold text-blue-400 mb-1">Reviewing Application Plan</h3>
                                       <p className="text-xs text-blue-300/80">Review the pages, database schema, and API routes below. You can ask me to change anything using the chat on the left.</p>
                                    </div>
                                 </div>
                              )}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                 {spec.pages?.map((page, i) => (
                                   <div key={i} className="group relative bg-[#151923] border border-slate-800 rounded-xl overflow-hidden hover:border-slate-600 transition shadow-xl">
                                      <div className="h-8 bg-slate-900 border-b border-slate-800 flex items-center px-3 gap-2">
                                         <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500/20"></div><div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20"></div><div className="w-2.5 h-2.5 rounded-full bg-green-500/20"></div></div>
                                         <div className="ml-2 text-[10px] text-slate-500 font-mono bg-slate-950 px-2 rounded w-full truncate">/{page.name.toLowerCase().replace(/\s/g, '-')}</div>
                                      </div>
                                      <div className="p-6 h-48 flex flex-col items-center justify-center text-center">
                                         <h3 className="text-lg font-medium text-slate-200 mb-2">{page.name}</h3>
                                         <p className="text-xs text-slate-500 max-w-[80%] mb-4 line-clamp-2">{page.description}</p>
                                      </div>
                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center backdrop-blur-sm">
                                         <button onClick={() => handleOpenEditModal(page)} className="bg-white text-black px-4 py-2 rounded-full text-xs font-medium transform translate-y-2 group-hover:translate-y-0 transition flex items-center gap-2">
                                            <Edit2 className="w-3.5 h-3.5" /> Edit Page
                                         </button>
                                      </div>
                                   </div>
                                 ))}
                              </div>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                 <div className="bg-[#151923] border border-slate-800 rounded-xl p-6">
                                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Database className="w-4 h-4 text-purple-400" /> Database Schema</h3>
                                    <div className="space-y-4">{spec.database?.map((model, i) => (<div key={i} className="bg-slate-900 rounded-lg p-3 border border-slate-800/50"><div className="flex justify-between items-center mb-2"><div className="text-xs font-bold text-yellow-500 font-mono">model {model.model}</div><div className="text-[10px] text-slate-600 uppercase">Table</div></div><div className="space-y-1">{model.fields.map((field, j) => (<div key={j} className="text-[10px] text-slate-400 font-mono pl-2 border-l border-slate-700 flex justify-between"><span>{field.split(' ')[0]}</span><span className="text-slate-600">{field.split(' ').slice(1).join(' ')}</span></div>))}</div></div>))}</div>
                                 </div>
                                 <div className="bg-[#151923] border border-slate-800 rounded-xl p-6">
                                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Server className="w-4 h-4 text-green-400" /> API Endpoints</h3>
                                    <div className="space-y-3">{spec.apiRoutes?.map((route, i) => (<div key={i} className="bg-slate-900 rounded-lg p-3 border border-slate-800/50 flex flex-col gap-2"><div className="flex items-center gap-2"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${route.method === 'GET' ? 'bg-blue-500/20 text-blue-400' : route.method === 'POST' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{route.method}</span><span className="text-xs font-mono text-slate-300">{route.path}</span></div><p className="text-[10px] text-slate-500">{route.description}</p></div>))}</div>
                                 </div>
                              </div>
                           </div>
                        )}
                        
                        {previewMode === 'app' && (
                           <div className="h-full animate-in fade-in zoom-in duration-300">
                              <AppInteractivePreview spec={spec} settings={settings} platform={config.platform} />
                           </div>
                        )}
                     </div>
                  </div>
                )}
                {activeTab === 'code' && (
                  <div className="h-full flex flex-col p-4">
                     <div className="flex-1 grid grid-cols-12 gap-4 h-full">
                         {/* File Tree */}
                         <div className="col-span-3 bg-[#151923] border border-slate-800 rounded-xl p-4 overflow-auto">
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 px-2">Project Files</h3>
                            <div className="space-y-1 font-mono text-xs">
                               <FileTreeItem name="prisma" isFolder open>
                                 <FileTreeItem name="schema.prisma" onClick={() => setSelectedFile('schema.prisma')} isSelected={selectedFile === 'schema.prisma'} />
                               </FileTreeItem>
                               
                               {/* Dynamic Integration Files */}
                               {(integrations.supabase || integrations.resend || integrations.twilio) && (
                                  <FileTreeItem name=".env" onClick={() => setSelectedFile('.env')} isSelected={selectedFile === '.env'} />
                               )}
                               
                               {integrations.supabase && (
                                  <FileTreeItem name="supabase" isFolder open>
                                     <FileTreeItem name="migrations" isFolder open>
                                        <FileTreeItem name="init.sql" onClick={() => setSelectedFile('supabase/migrations/init.sql')} isSelected={selectedFile === 'supabase/migrations/init.sql'} />
                                     </FileTreeItem>
                                  </FileTreeItem>
                               )}

                               {integrations.github && (
                                  <FileTreeItem name=".github" isFolder open>
                                     <FileTreeItem name="workflows" isFolder open>
                                        <FileTreeItem name="deploy.yml" onClick={() => setSelectedFile('.github/workflows/deploy.yml')} isSelected={selectedFile === '.github/workflows/deploy.yml'} />
                                     </FileTreeItem>
                                  </FileTreeItem>
                               )}

                               {config.platform === 'web' ? (
                                  <FileTreeItem name="src" isFolder open>
                                    <FileTreeItem name="app" isFolder open>
                                        <FileTreeItem name="layout.tsx" onClick={() => setSelectedFile('layout.tsx')} isSelected={selectedFile === 'layout.tsx'} />
                                        {spec.pages?.map((p, i) => (
                                          <FileTreeItem 
                                            key={i} 
                                            name={`${p.name.toLowerCase().replace(/\s/g, '-')}/page.tsx`} 
                                            onClick={() => setSelectedFile(`${p.name.toLowerCase().replace(/\s/g, '-')}/page.tsx`)}
                                            isSelected={selectedFile === `${p.name.toLowerCase().replace(/\s/g, '-')}/page.tsx`}
                                          />
                                        ))}
                                    </FileTreeItem>
                                    <FileTreeItem name="components" isFolder />
                                  </FileTreeItem>
                               ) : (
                                  <FileTreeItem name="src" isFolder open>
                                    <FileTreeItem name="screens" isFolder open>
                                      {spec.pages?.map((p, i) => (
                                          <FileTreeItem 
                                            key={i} 
                                            name={`${p.name.replace(/\s/g, '')}Screen.tsx`} 
                                            onClick={() => setSelectedFile(`screens/${p.name.replace(/\s/g, '')}Screen.tsx`)}
                                            isSelected={selectedFile === `screens/${p.name.replace(/\s/g, '')}Screen.tsx`}
                                          />
                                        ))}
                                    </FileTreeItem>
                                    <FileTreeItem name="App.tsx" onClick={() => setSelectedFile('App.tsx')} isSelected={selectedFile === 'App.tsx'} />
                                  </FileTreeItem>
                               )}
                               
                               <FileTreeItem name="package.json" />
                               <FileTreeItem name="README.md" />
                            </div>
                         </div>
                         
                         {/* Code Editor */}
                         <div className="col-span-9 bg-[#0d1117] border border-slate-800 rounded-xl flex flex-col overflow-hidden">
                            <div className="bg-[#151923] border-b border-slate-800 px-4 py-2 flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                  <FileCode className="w-4 h-4 text-blue-400" />
                                  <span className="text-sm font-medium text-slate-300">{selectedFile}</span>
                               </div>
                               <div className="flex items-center gap-3">
                                  <button onClick={handleCopyCode} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded">
                                     <Copy className="w-3 h-3" /> Copy
                                  </button>
                                  <div className="text-xs text-slate-500">TypeScript</div>
                               </div>
                            </div>
                            <div className="flex-1 overflow-auto p-0">
                               <SyntaxHighlighter code={selectedFile ? generateFileContent(selectedFile) : '// Select a file to view source'} />
                            </div>
                         </div>
                     </div>
                  </div>
                )}
                {activeTab === 'integrations' && (
                  <div className="max-w-4xl mx-auto space-y-6 animate-accordion-down p-8">
                     <h2 className="text-2xl font-bold text-white mb-6">Integrations</h2>
                     
                     {/* GitHub Integration */}
                     <div className="bg-[#151923] border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-slate-600 transition">
                       <div className="flex gap-4">
                          <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800">
                             <Github className="w-6 h-6 text-white" />
                          </div>
                          <div>
                             <h3 className="text-lg font-semibold text-white">GitHub</h3>
                             <p className="text-sm text-slate-500">Push your code to a new repository and set up CI/CD.</p>
                             {integrations.github && <div className="mt-2 text-xs text-green-400 flex items-center gap-1"><Check className="w-3 h-3" /> Linked to {repoUrl.replace("https://github.com/", "")}</div>}
                          </div>
                       </div>
                       <button 
                          onClick={() => !integrations.github && handleConnectIntegration('github')}
                          disabled={integrations.github}
                          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition ${integrations.github ? 'bg-green-500/10 text-green-500 cursor-default' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                       >
                          {integrations.github ? <><Check className="w-4 h-4" /> Synced</> : <><Github className="w-4 h-4" /> Connect & Push</>}
                       </button>
                     </div>

                     {/* Supabase Integration */}
                     <div className="bg-[#151923] border border-slate-800 rounded-xl p-6 flex flex-col gap-4 hover:border-slate-600 transition">
                       <div className="flex justify-between items-start">
                          <div className="flex gap-4">
                             <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800">
                                <Database className="w-6 h-6 text-green-400" />
                             </div>
                             <div>
                                <h3 className="text-lg font-semibold text-white">Supabase</h3>
                                <p className="text-sm text-slate-500">Connect to your Supabase project to deploy the database schema.</p>
                             </div>
                          </div>
                          {integrations.supabase ? <div className="text-green-500"><CheckCircle className="w-5 h-5" /></div> : null}
                       </div>
                       
                       {!integrations.supabase ? (
                          <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-xs text-slate-500 mb-1 block">Project URL</label>
                                <input 
                                   type="text" 
                                   placeholder="https://xyz.supabase.co" 
                                   className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-white outline-none focus:border-green-500 transition placeholder-slate-600"
                                   value={supabaseInputs.url}
                                   onChange={(e) => setSupabaseInputs({...supabaseInputs, url: e.target.value})}
                                />
                             </div>
                             <div>
                                <label className="text-xs text-slate-500 mb-1 block">Anon Key</label>
                                <input 
                                   type="password" 
                                   placeholder="eyJhbG..." 
                                   className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-white outline-none focus:border-green-500 transition placeholder-slate-600"
                                   value={supabaseInputs.key}
                                   onChange={(e) => setSupabaseInputs({...supabaseInputs, key: e.target.value})}
                                />
                             </div>
                          </div>
                       ) : (
                          <div className="mt-2 p-2 bg-slate-900 rounded border border-slate-800 text-xs font-mono text-slate-400">
                             <div>URL: {supabaseConfig.url}</div>
                             <div className="text-green-400 mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> Database Schema Deployed</div>
                          </div>
                       )}

                       <button 
                          onClick={() => !integrations.supabase && handleConnectIntegration('supabase')}
                          disabled={integrations.supabase}
                          className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition ${integrations.supabase ? 'bg-green-500/10 text-green-500 cursor-default' : 'bg-green-600 text-white hover:bg-green-700'}`}
                       >
                          {integrations.supabase ? <><Check className="w-4 h-4" /> Connected & Deployed</> : <><Cloud className="w-4 h-4" /> Connect Supabase</>}
                       </button>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Resend Integration */}
                        <div className="bg-[#151923] border border-slate-800 rounded-xl p-6 flex flex-col gap-4 hover:border-slate-600 transition">
                           <div className="flex justify-between items-start">
                              <div className="flex gap-4">
                                 <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800">
                                    <Mail className="w-5 h-5 text-white" />
                                 </div>
                                 <div>
                                    <h3 className="font-semibold text-white">Resend</h3>
                                    <p className="text-xs text-slate-500">Transactional Email API</p>
                                 </div>
                              </div>
                              {integrations.resend ? <div className="text-green-500"><CheckCircle className="w-5 h-5" /></div> : null}
                           </div>
                           {!integrations.resend ? (
                              <input 
                                 type="text" 
                                 placeholder="Paste re_123..." 
                                 className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-white outline-none focus:border-white transition placeholder-slate-600"
                                 value={apiKeys.resend}
                                 onChange={(e) => setApiKeys({...apiKeys, resend: e.target.value})}
                              />
                           ) : (
                              <div className="text-xs text-slate-500 font-mono bg-slate-900 p-2 rounded border border-slate-800">Key: {apiKeys.resend.substring(0,6)}...</div>
                           )}
                           <button 
                              onClick={() => !integrations.resend && handleConnectIntegration('resend')}
                              disabled={integrations.resend}
                              className={`w-full py-2 rounded-lg text-xs font-medium border ${integrations.resend ? 'border-green-500/20 text-green-500 bg-green-500/5' : 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'}`}
                           >
                              {integrations.resend ? 'Configured' : 'Connect Resend'}
                           </button>
                        </div>

                        {/* Twilio Integration */}
                        <div className="bg-[#151923] border border-slate-800 rounded-xl p-6 flex flex-col gap-4 hover:border-slate-600 transition">
                           <div className="flex justify-between items-start">
                              <div className="flex gap-4">
                                 <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800">
                                    <Smartphone className="w-5 h-5 text-red-500" />
                                 </div>
                                 <div>
                                    <h3 className="font-semibold text-white">Twilio</h3>
                                    <p className="text-xs text-slate-500">SMS & Messaging</p>
                                 </div>
                              </div>
                              {integrations.twilio ? <div className="text-green-500"><CheckCircle className="w-5 h-5" /></div> : null}
                           </div>
                           {!integrations.twilio ? (
                              <input 
                                 type="text" 
                                 placeholder="Paste Account SID..." 
                                 className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-white outline-none focus:border-white transition placeholder-slate-600"
                                 value={apiKeys.twilio}
                                 onChange={(e) => setApiKeys({...apiKeys, twilio: e.target.value})}
                              />
                           ) : (
                              <div className="text-xs text-slate-500 font-mono bg-slate-900 p-2 rounded border border-slate-800">SID: {apiKeys.twilio.substring(0,6)}...</div>
                           )}
                           <button 
                              onClick={() => !integrations.twilio && handleConnectIntegration('twilio')}
                              disabled={integrations.twilio}
                              className={`w-full py-2 rounded-lg text-xs font-medium border ${integrations.twilio ? 'border-green-500/20 text-green-500 bg-green-500/5' : 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'}`}
                           >
                              {integrations.twilio ? 'Configured' : 'Connect Twilio'}
                           </button>
                        </div>
                     </div>
                  </div>
                )}
             </>
           ) : null}
        </div>
      </div>
    </div>
  );
};

const LandingView = ({ onStartBuilder, onViewChange, settings, onUpdateSettings }: { onStartBuilder: (cfg: BuilderConfig) => void, onViewChange: (v: string) => void, settings: AppSettings, onUpdateSettings: (s: AppSettings) => void }) => {
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState<'web' | 'mobile'>('web');
  const [framework, setFramework] = useState('Next.js');

  const webFrameworks = ['Next.js', 'React', 'Vue', 'Remix', 'Svelte'];
  const mobileFrameworks = ['React Native', 'Expo', 'Flutter', 'SwiftUI'];
  
  const currentFrameworks = platform === 'web' ? webFrameworks : mobileFrameworks;

  // Reset framework when platform changes
  useEffect(() => {
     setFramework(currentFrameworks[0]);
  }, [platform]);

  const handleStartBuilder = () => {
    if (!prompt.trim()) return;
    onStartBuilder({ prompt, platform, framework });
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden flex flex-col">
      <Header onViewChange={onViewChange} currentView="home" settings={settings} />
      <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 py-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[120px] -z-10 opacity-30 pointer-events-none" style={{ backgroundColor: settings.primaryColor }}></div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50 border border-slate-800 text-slate-400 text-xs mb-8">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          v2.5 Release: Now with Gemini Flash Support
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 mb-6 tracking-tight">
          Ship your startup <br/> in <span style={{ color: settings.primaryColor }}>one prompt</span>.
        </h1>
        <p className="text-slate-400 text-lg md:text-xl text-center max-w-2xl mb-10">
          Describe your idea. {settings.appName} generates the backend, frontend, database schema, and deployment pipeline instantly.
        </p>
        
        <div className="w-full max-w-2xl space-y-4">
           {/* Controls */}
           <div className="flex items-center justify-center gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-1 flex">
                 <button 
                    onClick={() => setPlatform('web')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${platform === 'web' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                 >
                    <Laptop className="w-4 h-4" /> Web App
                 </button>
                 <button 
                    onClick={() => setPlatform('mobile')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${platform === 'mobile' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                 >
                    <Tablet className="w-4 h-4" /> Mobile App
                 </button>
              </div>
              
              <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 flex items-center gap-3">
                 <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Framework</span>
                 <select 
                    value={framework}
                    onChange={(e) => setFramework(e.target.value)}
                    className="bg-transparent text-white text-sm font-medium outline-none cursor-pointer"
                 >
                    {currentFrameworks.map(fw => (
                       <option key={fw} value={fw} className="bg-slate-900">{fw}</option>
                    ))}
                 </select>
              </div>

               <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 flex items-center gap-3">
                   <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Project Name</span>
                   <input 
                      type="text" 
                      value={settings.appName}
                      onChange={(e) => onUpdateSettings({...settings, appName: e.target.value})}
                      className="bg-transparent text-white text-sm font-medium outline-none w-32 focus:w-48 transition-all"
                      placeholder="My App"
                   />
                </div>
           </div>

           {/* Input */}
           <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000" style={{ background: `linear-gradient(to right, ${settings.primaryColor}, #4f46e5)` }}></div>
              <div className="relative bg-slate-900 rounded-xl p-2 flex items-center shadow-2xl border border-slate-800">
              <div className="p-3 text-slate-400"><Zap className="w-5 h-5" /></div>
              <input 
                 type="text" 
                 placeholder={`Describe your ${platform} app...`} 
                 className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate-500 text-lg"
                 value={prompt}
                 onChange={(e) => setPrompt(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleStartBuilder()}
              />
              <button onClick={handleStartBuilder} className="bg-white text-black hover:bg-slate-200 px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2">
                 Generate <ChevronRight className="w-4 h-4" />
              </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---

const App = () => {
  const [currentView, setCurrentView] = useState('home');
  const [builderConfig, setBuilderConfig] = useState<BuilderConfig>({ prompt: '', platform: 'web', framework: 'Next.js' });
  const [appSettings, setAppSettings] = useState<AppSettings>({ appName: "HelloJadanAI", primaryColor: "#7c3aed" });
  
  // Lifted Provider State to manage API Keys globally
  const [providers, setProviders] = useState(INITIAL_PROVIDERS);

  const handleStartBuilder = (config: BuilderConfig) => {
    setBuilderConfig(config);
    setCurrentView('builder');
  };
  
  // Extract Gemini API Key (if set by user in Admin Panel)
  const geminiKey = providers.find(p => p.id === 'p1')?.apiKey;

  const renderContent = () => {
    switch(currentView) {
      case 'home':
        return <LandingView onStartBuilder={handleStartBuilder} onViewChange={setCurrentView} settings={appSettings} onUpdateSettings={setAppSettings} />;
      case 'builder':
        return <BuilderChatInterface config={builderConfig} onViewChange={setCurrentView} settings={appSettings} apiKey={geminiKey} />;
      case 'admin-dash':
      case 'admin-users':
      case 'admin-tasks':
      case 'admin-ai':
      case 'admin-settings':
        return (
          <div className="min-h-screen bg-slate-950 flex">
            <AdminSidebar currentView={currentView} onViewChange={setCurrentView} settings={appSettings} />
            <div className="flex-1 overflow-auto bg-slate-950">
               {currentView === 'admin-dash' && <AdminDashboard />}
               {currentView === 'admin-users' && <AdminUsers />}
               {currentView === 'admin-tasks' && <AdminTasks />}
               {currentView === 'admin-ai' && <AdminProviders providers={providers} onUpdate={setProviders} />}
               {currentView === 'admin-settings' && <AdminSettingsView settings={appSettings} onUpdate={setAppSettings} />}
            </div>
          </div>
        );
      default:
        return <LandingView onStartBuilder={handleStartBuilder} onViewChange={setCurrentView} settings={appSettings} onUpdateSettings={setAppSettings} />;
    }
  };

  return <>{renderContent()}</>;
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}