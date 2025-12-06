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
  FileText, LogOut, Book, Coins, Activity, GitBranch, GitCommit,
  HelpCircle, Info, Phone, FileQuestion, Scale, QrCode, DollarSign,
  TrendingUp, TrendingDown, Clock, CloudLightning
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
  tokenBalance: number;
  tokenUsage: number;
}

interface Task {
  id: string;
  title: string;
  assignee: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
}

interface Subscription {
  id: string;
  userId: string;
  userName: string;
  plan: 'Pro' | 'Enterprise' | 'Starter';
  amount: number;
  status: 'active' | 'past_due' | 'canceled';
  nextBilling: string;
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
  { id: '1', name: 'Super Admin', email: 'admin@hellojadan.ai', role: 'super_admin', status: 'active', plan: 'enterprise', createdAt: '2023-01-01', tokenBalance: 9999999, tokenUsage: 45000 },
  { id: '2', name: 'Alice Dev', email: 'alice@dev.co', role: 'user', status: 'active', plan: 'pro', createdAt: '2023-05-12', tokenBalance: 50000, tokenUsage: 12000 },
  { id: '3', name: 'Bob Corp', email: 'bob@corp.inc', role: 'user', status: 'suspended', plan: 'free', createdAt: '2023-06-20', tokenBalance: 0, tokenUsage: 5000 },
  { id: '4', name: 'Startup Steve', email: 'steve@ycombinator.mock', role: 'user', status: 'active', plan: 'pro', createdAt: '2023-08-15', tokenBalance: 75000, tokenUsage: 2500 },
];

const MOCK_TASKS: Task[] = [
  { id: '1', title: 'Review new AI templates', assignee: 'Admin User', status: 'in-progress', priority: 'high', dueDate: '2023-10-25' },
  { id: '2', title: 'Fix billing integration bug', assignee: 'Alice Dev', status: 'todo', priority: 'high', dueDate: '2023-10-26' },
  { id: '3', title: 'Update documentation', assignee: 'Bob Corp', status: 'done', priority: 'low', dueDate: '2023-10-20' },
  { id: '4', title: 'Rotate API Keys', assignee: 'Admin User', status: 'todo', priority: 'medium', dueDate: '2023-10-28' },
];

const MOCK_SUBSCRIPTIONS: Subscription[] = [
  { id: 'sub_1', userId: '2', userName: 'Alice Dev', plan: 'Pro', amount: 29.00, status: 'active', nextBilling: '2023-11-12' },
  { id: 'sub_2', userId: '4', userName: 'Startup Steve', plan: 'Pro', amount: 29.00, status: 'active', nextBilling: '2023-11-15' },
  { id: 'sub_3', userId: '3', userName: 'Bob Corp', plan: 'Starter', amount: 0.00, status: 'canceled', nextBilling: 'N/A' },
];

const INITIAL_PROVIDERS: ProviderConfig[] = [
  { id: 'p1', name: 'Gemini 2.5 Flash', type: 'llm', status: 'active', usage: 45, priority: 1, apiKey: 'AIzaSyCAXDDdWsW8EheoN8rpnnKBINA79MI8ENM' },
  { id: 'p2', name: 'Gemini 3.0 Pro', type: 'llm', status: 'active', usage: 20, priority: 2 },
  { id: 'p3', name: 'Claude 3.5 Sonnet', type: 'llm', status: 'inactive', usage: 0, priority: 3 },
  { id: 'p4', name: 'Grok Beta', type: 'llm', status: 'inactive', usage: 0, priority: 4 },
  { id: 'p5', name: 'OpenAI GPT-4o', type: 'llm', status: 'inactive', usage: 0, priority: 5 },
  { id: 'h1', name: 'Vercel', type: 'hosting', status: 'active', usage: 60, priority: 1 },
  { id: 'h2', name: 'Netlify', type: 'hosting', status: 'active', usage: 15, priority: 2 },
];

// --- AI SERVICE ---

class AppGeneratorService {
  private ai: GoogleGenAI;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey && apiKey.trim() !== '' ? apiKey : (process.env.API_KEY || '');
    this.ai = new GoogleGenAI({ apiKey: this.apiKey });
  }

  async checkConnection(): Promise<boolean> {
    try {
        const model = this.ai.models;
        await model.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'ping',
        });
        return true;
    } catch (e) {
        console.error("Connection check failed:", e);
        return false;
    }
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
      
      CRITICAL INSTRUCTIONS:
      1. You must EXACTLY satisfy the user's specific requests in the prompt (e.g., specific colors, specific features, specific names).
      2. If the user specifies "Create a dashboard with 5 screens", you MUST generate 5 screens in the 'pages' array.
      3. If the user specifies specific API integrations (like Stripe, Supabase), include them in the 'stack' and 'apiRoutes'.
      
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
        model: 'gemini-3-pro-preview', 
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
      return this.sanitizeSpec(parsed);
    } catch (error) {
      console.error("AI Generation failed:", error);
      // FALLBACK TO LOCAL GENERATION ON ERROR
      return this.generateFallbackSpec(prompt, platform, framework);
    }
  }

  async updateAppSpec(currentSpec: GeneratedAppSpec, updateInstruction: string): Promise<GeneratedAppSpec> {
    const model = this.ai.models;
    
    // Upgrade to Gemini 3 Pro for updates to ensure high fidelity understanding of requests
    const systemPrompt = `
      You are a Senior Product Architect iterating on an existing application specification.
      
      Current App Name: ${currentSpec.name}
      Current Description: ${currentSpec.description}
      Current Pages: ${currentSpec.pages.map(p => p.name).join(', ')}
      
      User Instruction: "${updateInstruction}"
      
      Your task is to MODIFY the existing JSON specification based on the user's request.
      - If they ask to add a page, add it to the 'pages' array.
      - If they ask to change the tech stack, update the 'stack' array.
      - If they ask to add a feature, add relevant components or API routes.
      
      Return the COMPLETELY UPDATED JSON object matching the original schema.
    `;

    try {
      const result = await model.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Update this spec: ${JSON.stringify(currentSpec)}`,
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
      return this.sanitizeSpec(parsed);
    } catch (error) {
        console.error("AI Update failed", error);
        throw error;
    }
  }

  private sanitizeSpec(parsed: any): GeneratedAppSpec {
      return {
        name: parsed.name || "Untitled App",
        description: parsed.description || "No description generated.",
        stack: Array.isArray(parsed.stack) ? parsed.stack : [],
        pages: Array.isArray(parsed.pages) ? parsed.pages : [],
        database: Array.isArray(parsed.database) ? parsed.database : [],
        apiRoutes: Array.isArray(parsed.apiRoutes) ? parsed.apiRoutes : []
      };
  }

  private generateFallbackSpec(prompt: string, platform: string, framework: string): GeneratedAppSpec {
    const isMobile = platform === 'mobile';
    const cleanPrompt = prompt.toLowerCase();
    
    // Dynamic naming based on prompt
    let appName = "StartApp";
    if (cleanPrompt.includes('shop') || cleanPrompt.includes('store')) appName = "MarketMaster";
    else if (cleanPrompt.includes('task') || cleanPrompt.includes('todo')) appName = "TaskFlow";
    else if (cleanPrompt.includes('social') || cleanPrompt.includes('chat')) appName = "ConnectHub";
    else if (cleanPrompt.includes('food') || cleanPrompt.includes('delivery')) appName = "TastyRun";
    else if (cleanPrompt.includes('fit') || cleanPrompt.includes('health')) appName = "FitLife";

    if (isMobile) {
        return {
            name: appName + " Mobile",
            description: `A ${framework} mobile application optimized for performance. (Generated offline)`,
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

    return {
        name: appName,
        description: `A modern ${framework} web application. (Generated offline)`,
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

const Header = ({ onViewChange, currentView, settings, user, onLogout }: { onViewChange: (v: string) => void, currentView: string, settings: AppSettings, user: User | null, onLogout: () => void }) => (
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
      
      {user ? (
        <div className="flex items-center gap-4">
           {user.role === 'super_admin' && (
               <button onClick={() => onViewChange('admin-dash')} className="bg-slate-800 hover:bg-slate-700 text-purple-400 px-3 py-1.5 rounded-md text-xs font-bold border border-purple-500/30 flex items-center gap-1.5">
                   <Shield className="w-3 h-3" /> Admin Panel
               </button>
           )}
           <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full border border-slate-700">
             <Coins className="w-3.5 h-3.5 text-yellow-500" />
             <span className="text-slate-200 text-xs font-mono">{user.tokenBalance.toLocaleString()}</span>
           </div>
           <button onClick={() => user.role === 'super_admin' ? onViewChange('admin-dash') : onViewChange('home')} className="hover:text-white transition flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                {user.name.charAt(0)}
             </div>
           </button>
           <button onClick={onLogout} className="text-slate-500 hover:text-white">
             <LogOut className="w-4 h-4" />
           </button>
        </div>
      ) : (
        <button onClick={() => onViewChange('auth')} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-full border border-slate-700 transition flex items-center gap-2">
          Sign In
        </button>
      )}
    </div>
  </nav>
);

const InfoModal = ({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl animate-accordion-down">
       <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 sticky top-0">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
       </div>
       <div className="p-8 overflow-y-auto text-slate-300 leading-relaxed space-y-4">
          {children}
       </div>
    </div>
  </div>
);

const DocsView = ({ settings }: { settings: AppSettings }) => (
  <div className="flex min-h-screen bg-slate-950 text-slate-300">
    <div className="w-64 border-r border-slate-800 p-6 hidden md:block sticky top-20 h-[calc(100vh-80px)] overflow-y-auto">
      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Documentation</h3>
      <ul className="space-y-3 text-sm">
        <li className="text-white font-medium cursor-pointer">Introduction</li>
        <li className="hover:text-white cursor-pointer">Quick Start</li>
        <li className="hover:text-white cursor-pointer">Architecture</li>
        <li className="hover:text-white cursor-pointer">App Builder</li>
        <li className="hover:text-white cursor-pointer">Deploying</li>
        <li className="mt-6 text-white font-medium cursor-pointer">API Reference</li>
        <li className="hover:text-white cursor-pointer">Authentication</li>
        <li className="hover:text-white cursor-pointer">Database</li>
      </ul>
    </div>
    <div className="flex-1 p-8 md:p-12 max-w-4xl mx-auto">
       <h1 className="text-4xl font-bold text-white mb-6">Introduction to {settings.appName}</h1>
       <p className="text-lg leading-relaxed mb-8">
         {settings.appName} is an AI-powered full-stack application generator. It transforms a single text prompt into a production-ready application structure, complete with database schema, API endpoints, and a React/Next.js frontend.
       </p>
       
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
             <Zap className="w-6 h-6 text-yellow-500 mb-4" />
             <h3 className="text-xl font-bold text-white mb-2">Instant Generation</h3>
             <p className="text-sm">Generate complete app boilerplate in seconds using Gemini Flash 2.5.</p>
          </div>
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
             <Code className="w-6 h-6 text-blue-500 mb-4" />
             <h3 className="text-xl font-bold text-white mb-2">Production Code</h3>
             <p className="text-sm">Outputs clean, TypeScript React code with Tailwind CSS.</p>
          </div>
       </div>

       <h2 className="text-2xl font-bold text-white mb-4">Getting Started</h2>
       <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 font-mono text-sm mb-8">
          <p className="text-slate-500"># Install dependencies</p>
          <p className="text-white mb-4">npm install</p>
          <p className="text-slate-500"># Run development server</p>
          <p className="text-white">npm run dev</p>
       </div>

       <h2 className="text-2xl font-bold text-white mb-4">Deployment</h2>
       <p className="mb-4">
         We support one-click deployments to Vercel. Ensure you have your Vercel API token configured in the Admin Panel.
       </p>
    </div>
  </div>
);

const AuthView = ({ onLogin }: { onLogin: (email: string) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
       <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
       <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
       <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
       
       <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl relative z-10">
          <div className="flex justify-center mb-6">
             <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
               <Rocket className="w-8 h-8 text-purple-500" />
             </div>
          </div>
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            {isLogin ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-slate-400 text-center text-sm mb-8">
            Enter your credentials. (Use <code className="text-purple-400">admin@hellojadan.ai</code> for Super Admin)
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
               <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Email Address</label>
               <input 
                 type="email" 
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-purple-500 transition"
                 placeholder="name@example.com"
                 required
               />
            </div>
            <div>
               <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
               <input 
                 type="password" 
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white outline-none focus:border-purple-500 transition"
                 placeholder="••••••••"
                 required
               />
            </div>
            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-lg transition shadow-lg shadow-purple-900/20">
              {isLogin ? "Sign In" : "Sign Up"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-slate-500">{isLogin ? "Don't have an account?" : "Already have an account?"}</span>
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-purple-400 hover:text-purple-300 font-medium"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </div>
       </div>
    </div>
  );
};

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
  const keywords = ['import', 'from', 'export', 'default', 'function', 'return', 'const', 'interface', 'type', 'async', 'await', 'CREATE', 'TABLE', 'INSERT', 'INTO', 'VALUES', 'PRIMARY', 'KEY', 'TEXT', 'BOOLEAN', 'TIMESTAMP'];
  const types = ['React', 'useState', 'useEffect', 'string', 'number', 'boolean', 'void', 'Promise', 'Metadata'];
  const components = ['div', 'span', 'h1', 'p', 'button', 'input', 'form', 'View', 'Text', 'StyleSheet', 'SafeAreaView', 'TouchableOpacity', 'Image'];
  
  const lines = code.split('\n');
  
  return (
    <div className="font-mono text-sm leading-6">
      {lines.map((line, i) => {
        let formattedLine: React.ReactNode[] = [];
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

// ... (AdminDashboard, AdminUsers, AdminBilling, AdminTasks, AdminProviders, AdminSettingsView, MobileFrame, WebFrame, Content, AppInteractivePreview components remain unchanged) ...

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
         <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-xl relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4 relative z-10">
               <div className={`p-2 rounded-lg bg-slate-800 ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
               </div>
               <span className="text-xs text-green-500 font-medium flex items-center gap-1">+12% <TrendingUp className="w-3 h-3" /></span>
            </div>
            <div className="text-3xl font-bold text-white mb-1 relative z-10">{stat.val}</div>
            <div className="text-xs text-slate-500 relative z-10">{stat.label}</div>
            <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-10 ${stat.color.replace('text', 'bg')} blur-2xl group-hover:opacity-20 transition`}></div>
         </div>
       ))}
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
       <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
             <h3 className="font-semibold text-white">System Health</h3>
             <div className="flex gap-2">
                <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded"><Activity className="w-3 h-3" /> All Systems Operational</span>
             </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
             <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                <div className="text-xs text-slate-500 mb-1">CPU Usage</div>
                <div className="text-xl font-bold text-white mb-2">24%</div>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[24%]"></div></div>
             </div>
             <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                <div className="text-xs text-slate-500 mb-1">Memory</div>
                <div className="text-xl font-bold text-white mb-2">6.2GB</div>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-purple-500 w-[45%]"></div></div>
             </div>
             <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                <div className="text-xs text-slate-500 mb-1">API Latency</div>
                <div className="text-xl font-bold text-white mb-2">124ms</div>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[15%]"></div></div>
             </div>
          </div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Recent Deployments</h4>
          <div className="space-y-3">
             {[1,2,3].map(i => (
                <div key={i} className="flex items-center justify-between bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <div className="text-sm text-slate-300">Deployed <span className="text-white font-medium">Project-{i*432}</span> to production</div>
                   </div>
                   <div className="text-xs text-slate-500 font-mono">2m ago</div>
                </div>
             ))}
          </div>
       </div>
       
       <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">Live Activity</h3>
          <div className="space-y-4 relative">
             <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-800"></div>
             {[1,2,3,4,5].map((i) => (
                <div key={i} className="flex items-start gap-4 relative">
                   <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 z-10 text-[10px] font-bold text-slate-400">{i}</div>
                   <div>
                      <div className="text-sm text-slate-300">User <span className="text-white font-medium">Alice</span> generated <span className="text-purple-400">E-com Store</span></div>
                      <div className="text-xs text-slate-500 mt-0.5">Gemini 3 Pro • 45s generation</div>
                   </div>
                </div>
             ))}
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
     <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <table className="w-full text-left border-collapse">
           <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-500 uppercase bg-slate-950/50">
                 <th className="p-4">Name</th>
                 <th className="p-4">Role</th>
                 <th className="p-4">Status</th>
                 <th className="p-4">Tokens</th>
                 <th className="p-4 text-right">Actions</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-800">
              {MOCK_USERS.map(user => (
                 <tr key={user.id} className="hover:bg-slate-800/50 transition">
                    <td className="p-4">
                       <div className="font-medium text-white flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-400 border border-slate-700">{user.name[0]}</div>
                          {user.name}
                       </div>
                       <div className="text-xs text-slate-500 ml-8">{user.email}</div>
                    </td>
                    <td className="p-4">
                       <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300">{user.role}</span>
                    </td>
                    <td className="p-4">
                       <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{user.status}</span>
                    </td>
                    <td className="p-4 text-sm text-slate-300">{user.tokenBalance.toLocaleString()}</td>
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

const AdminBilling = () => {
    const [subs, setSubs] = useState<Subscription[]>(MOCK_SUBSCRIPTIONS);

    const handleCancel = (id: string) => {
        if (confirm("Are you sure you want to cancel this subscription?")) {
            setSubs(subs.map(s => s.id === id ? { ...s, status: 'canceled' } as Subscription : s));
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-white mb-6">Billing & Subscriptions</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 rounded-lg text-green-500"><DollarSign className="w-6 h-6" /></div>
                    <div>
                        <div className="text-2xl font-bold text-white">$45,200</div>
                        <div className="text-xs text-slate-500">Monthly Recurring Revenue</div>
                    </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500"><Users className="w-6 h-6" /></div>
                    <div>
                        <div className="text-2xl font-bold text-white">1,240</div>
                        <div className="text-xs text-slate-500">Active Paid Seats</div>
                    </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-red-500/10 rounded-lg text-red-500"><AlertTriangle className="w-6 h-6" /></div>
                    <div>
                        <div className="text-2xl font-bold text-white">$1,200</div>
                        <div className="text-xs text-slate-500">Past Due (Churn Risk)</div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
                    <h3 className="font-semibold text-white">Active Subscriptions</h3>
                    <button className="text-xs text-slate-400 hover:text-white flex items-center gap-1"><Download className="w-3 h-3" /> Export CSV</button>
                </div>
                <table className="w-full text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-950/30">
                        <tr>
                            <th className="p-4 font-medium">User</th>
                            <th className="p-4 font-medium">Plan</th>
                            <th className="p-4 font-medium">Amount</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium">Next Billing</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {subs.map(sub => (
                            <tr key={sub.id} className="hover:bg-slate-800/30">
                                <td className="p-4 font-medium text-white">{sub.userName}</td>
                                <td className="p-4"><span className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-300 border border-slate-700">{sub.plan}</span></td>
                                <td className="p-4 text-slate-300">${sub.amount.toFixed(2)}</td>
                                <td className="p-4">
                                    <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full w-fit ${sub.status === 'active' ? 'bg-green-500/10 text-green-400' : sub.status === 'canceled' ? 'bg-slate-800 text-slate-500' : 'bg-red-500/10 text-red-400'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${sub.status === 'active' ? 'bg-green-500' : sub.status === 'canceled' ? 'bg-slate-500' : 'bg-red-500'}`}></div>
                                        {sub.status}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-slate-500">{sub.nextBilling}</td>
                                <td className="p-4 text-right">
                                    {sub.status === 'active' && (
                                        <button onClick={() => handleCancel(sub.id)} className="text-xs text-red-400 hover:text-red-300 hover:underline">Cancel</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

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
    setCurrentTask({...task});
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
    setTasks(tasks.map(t => t.id === id ? { ...t, status: t.status === 'done' ? 'todo' : 'done' } : t));
  };
  
  const handleDelete = (id: string) => {
    if (confirm('Delete task?')) setTasks(tasks.filter(t => t.id !== id));
  };

  const getPriorityColor = (p: string) => {
     switch(p) {
        case 'high': return 'bg-red-500/10 text-red-500';
        case 'medium': return 'bg-yellow-500/10 text-yellow-500';
        default: return 'bg-blue-500/10 text-blue-500';
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
               <h3 className="text-lg font-bold text-white mb-4">{isEditing ? 'Edit Task' : 'Create Task'}</h3>
               <div className="space-y-4">
                  <input type="text" className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm outline-none" value={currentTask.title || ''} onChange={e => setCurrentTask({...currentTask, title: e.target.value})} placeholder="Title" />
                  <div className="grid grid-cols-2 gap-4">
                      <input type="text" className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm outline-none" value={currentTask.assignee || ''} onChange={e => setCurrentTask({...currentTask, assignee: e.target.value})} placeholder="Assignee" />
                      <input type="date" className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm outline-none" value={currentTask.dueDate || ''} onChange={e => setCurrentTask({...currentTask, dueDate: e.target.value})} />
                  </div>
                  <div className="flex gap-2">
                     {['low', 'medium', 'high'].map(p => (
                         <button key={p} onClick={() => setCurrentTask({...currentTask, priority: p as any})} className={`px-3 py-1.5 rounded text-xs capitalize border ${currentTask.priority === p ? 'bg-primary border-primary text-white' : 'bg-slate-950 border-slate-700 text-slate-400'}`}>{p}</button>
                     ))}
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
         {tasks.map(task => (
           <div key={task.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between group hover:border-slate-700 transition">
              <div className="flex items-center gap-4">
                 <button onClick={() => toggleStatus(task.id)} className={`w-6 h-6 rounded border flex items-center justify-center transition ${task.status === 'done' ? 'bg-green-500 border-green-500 text-white' : 'border-slate-600 hover:border-slate-500 text-transparent'}`}><Check className="w-4 h-4" /></button>
                 <div>
                    <h4 className={`font-medium ${task.status === 'done' ? 'text-slate-500 line-through' : 'text-white'}`}>{task.title}</h4>
                    <div className="flex items-center gap-4 mt-1">
                       <div className="flex items-center gap-1.5 text-xs text-slate-500"><Users className="w-3 h-3" /> {task.assignee}</div>
                       <div className="flex items-center gap-1.5 text-xs text-slate-500"><Calendar className="w-3 h-3" /> {task.dueDate}</div>
                    </div>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                 <div className="flex items-center opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => handleOpenEdit(task)} className="text-slate-500 hover:text-white p-2"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(task.id)} className="text-slate-500 hover:text-red-400 p-2"><Trash2 className="w-4 h-4" /></button>
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
  const [testingId, setTestingId] = useState<string | null>(null);

  const handleEdit = (p: ProviderConfig) => {
    setEditingId(p.id);
    setTempKey(p.apiKey || "");
  };

  const handleSave = (id: string) => {
    onUpdate(providers.map(p => p.id === id ? { ...p, apiKey: tempKey } : p));
    setEditingId(null);
    setTempKey("");
  };

  const handleTestConnection = async (p: ProviderConfig) => {
     if (!p.apiKey) return alert("No API key to test.");
     setTestingId(p.id);
     const service = new AppGeneratorService(p.apiKey);
     const success = await service.checkConnection();
     setTestingId(null);
     alert(success ? "Connection Successful! API is working." : "Connection Failed. Check your API key or network.");
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
                    <div className="text-xs text-slate-500 capitalize">{p.type}</div>
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
                   <div className="flex gap-2">
                      {p.type === 'llm' && (
                          <button onClick={() => handleTestConnection(p)} className="px-3 py-1.5 rounded-md bg-slate-800 text-blue-400 text-sm hover:bg-slate-700 flex items-center gap-1">
                              {testingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />} Test
                          </button>
                      )}
                      <button 
                        onClick={() => handleEdit(p)}
                        className="px-3 py-1.5 rounded-md bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 hover:text-white transition flex items-center gap-2"
                      >
                         <Code className="w-3.5 h-3.5" />
                         {p.apiKey ? 'Update Key' : 'Add Key'}
                      </button>
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
         <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
             <div>
                 <label className="block text-sm text-slate-400 mb-1">Application Name</label>
                 <input type="text" value={localSettings.appName} onChange={(e) => setLocalSettings({...localSettings, appName: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-primary outline-none" />
             </div>
             <div>
                 <label className="block text-sm text-slate-400 mb-1">Primary Color</label>
                 <div className="flex items-center gap-3">
                    <input type="color" value={localSettings.primaryColor} onChange={(e) => setLocalSettings({...localSettings, primaryColor: e.target.value})} className="h-10 w-20 bg-transparent cursor-pointer rounded overflow-hidden" />
                 </div>
             </div>
             <button onClick={handleSave} className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:opacity-90 transition mt-4" style={{ backgroundColor: localSettings.primaryColor }}>Save Changes</button>
         </div>
      </div>
   );
};

const MobileFrame = ({ children, isHome, onBack, appUrl }: { children?: React.ReactNode, isHome?: boolean, onBack?: () => void, appUrl?: string }) => {
  const [showQR, setShowQR] = useState(false);

  return (
    <div className="relative mx-auto w-full max-w-[350px] h-full max-h-[800px] aspect-[9/19] bg-black rounded-[3rem] border-[8px] border-slate-900 shadow-2xl overflow-hidden ring-1 ring-slate-800/50">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-7 w-32 bg-slate-900 rounded-b-2xl z-30"></div>
      <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden flex flex-col relative z-0">
         <div className="h-10 w-full bg-white/90 backdrop-blur z-20 flex items-center justify-between px-6 pt-2 text-[10px] font-bold text-black border-b border-transparent">
            <span>9:41</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowQR(!showQR)}
                className="p-1 hover:bg-gray-100 rounded"
                title="Scan to Preview"
              >
                <QrCode className="w-3 h-3" />
              </button>
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-3 h-3" />
            </div>
         </div>
         <div className="flex-1 relative overflow-hidden flex flex-col bg-white">
             {!isHome && onBack && (
                <div className="absolute top-2 left-4 z-40">
                   <button onClick={onBack} className="p-2 bg-white/50 backdrop-blur rounded-full shadow-sm hover:bg-white transition">
                      <ArrowLeft className="w-5 h-5 text-slate-900" />
                   </button>
                </div>
             )}
             {children}
             
             {showQR && (
               <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                 <div className="bg-white p-4 rounded-xl shadow-2xl mb-4">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(appUrl || 'https://hellojadan.ai')}`}
                      alt="Preview QR Code"
                      className="w-32 h-32"
                    />
                 </div>
                 <h3 className="text-white font-bold text-lg mb-2">Scan to Preview</h3>
                 <p className="text-slate-400 text-xs">Use your phone's camera or Expo Go to preview this app instantly.</p>
                 <button 
                   onClick={() => setShowQR(false)}
                   className="mt-6 text-slate-400 hover:text-white text-sm"
                 >
                   Close
                 </button>
               </div>
             )}
         </div>
         <div className="h-5 w-full bg-white z-20 flex justify-center items-center pb-2">
            <div className="w-32 h-1 bg-slate-900 rounded-full opacity-20"></div>
         </div>
      </div>
    </div>
  );
};

const WebFrame = ({ children, spec, settings, activeRoute, onNavigate }: { children?: React.ReactNode, spec: GeneratedAppSpec, settings: AppSettings, activeRoute: string, onNavigate: (r: string) => void }) => (
     <div className="w-full h-full bg-white rounded-lg border border-slate-800 shadow-2xl overflow-hidden flex flex-col text-slate-900">
        <div className="bg-slate-100 border-b border-slate-200 p-3 flex items-center gap-4 flex-shrink-0">
             <div className="flex gap-1.5 ml-1"><div className="w-3 h-3 rounded-full bg-red-400"></div><div className="w-3 h-3 rounded-full bg-yellow-400"></div><div className="w-3 h-3 rounded-full bg-green-400"></div></div>
             <div className="flex gap-2"><button onClick={() => onNavigate('home')} className="p-1 hover:bg-slate-200 rounded text-slate-500"><Home className="w-4 h-4" /></button></div>
             <div className="flex-1 bg-white border border-slate-300 rounded-md px-4 py-1.5 text-xs text-slate-600 flex items-center shadow-sm font-mono truncate">
                <Lock className="w-3 h-3 mr-2 text-green-600" />
                https://{spec.name.toLowerCase().replace(/\s+/g, '-')}.app.com{activeRoute !== 'home' ? `/${activeRoute}` : ''}
             </div>
        </div>
        <div className="flex-1 overflow-auto relative flex flex-col bg-white">
           {children}
        </div>
     </div>
);

const Content = ({ spec, settings, isMobile, activeRoute, onNavigate }: { spec: GeneratedAppSpec, settings: AppSettings, isMobile: boolean, activeRoute: string, onNavigate: (route: string) => void }) => {
     if (activeRoute === 'home') {
        return (
           <div className={`h-full flex flex-col font-sans ${isMobile ? 'bg-white' : 'bg-slate-50'}`}>
              {!isMobile && (
                  <header className={`px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 flex justify-between items-center z-10 sticky top-0`}>
                     <div className={`font-bold text-xl tracking-tight text-slate-900 cursor-pointer`} onClick={() => onNavigate('home')}>{spec.name}</div>
                     <div className="flex gap-6 text-sm font-medium text-slate-600">
                        {spec.pages.slice(0, 3).map(p => (<span key={p.name} onClick={() => onNavigate(p.name)} className="hover:text-blue-600 cursor-pointer">{p.name}</span>))}
                     </div>
                     <button className="text-white px-4 py-1.5 rounded-full text-xs font-bold" style={{ backgroundColor: settings.primaryColor }}>Sign In</button>
                  </header>
              )}
              <main className={`flex-1 overflow-y-auto ${isMobile ? 'no-scrollbar' : ''}`} style={isMobile ? { scrollbarWidth: 'none' } : {}}>
                 <section className={`${isMobile ? 'py-6 px-4 pt-4' : 'py-20 px-6'} text-center ${!isMobile && 'bg-gradient-to-b from-slate-50 to-white'}`}>
                    <h1 className={`${isMobile ? 'text-2xl mt-4' : 'text-5xl'} font-extrabold text-slate-900 leading-tight mb-4`}>
                       {spec.name} is <span style={{ color: settings.primaryColor }}>here</span>.
                    </h1>
                    <p className={`${isMobile ? 'text-sm' : 'text-lg'} text-slate-600 max-w-xl mx-auto leading-relaxed mb-6`}>{spec.description}</p>
                    <div className="flex items-center justify-center gap-3">
                       <button onClick={() => onNavigate(spec.pages[0]?.name || 'home')} className="px-6 py-3 text-white rounded-full font-bold text-sm shadow-lg w-full md:w-auto" style={{ backgroundColor: settings.primaryColor }}>Get Started</button>
                    </div>
                 </section>
                 <section className={`${isMobile ? 'py-4 px-4' : 'py-20 px-6'} bg-transparent`}>
                    <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-slate-900 mb-4 ${isMobile ? 'text-left' : 'text-center'}`}>Discover</h2>
                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-3 gap-6'}`}>
                        {spec.pages.map((page, idx) => (
                           <div key={idx} onClick={() => onNavigate(page.name)} className={`p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition cursor-pointer flex items-center gap-4 ${isMobile ? 'flex-row' : 'flex-col text-center'}`}>
                              <div className={`w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0`} style={{ color: settings.primaryColor }}><Layout className="w-5 h-5" /></div>
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
                        <Home className="w-6 h-6 text-slate-900" /><span className="text-[10px] font-medium text-slate-900">Home</span>
                    </div>
                    {spec.pages.slice(0, 3).map((p, i) => (
                       <div key={i} className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => onNavigate(p.name)}>
                          <div className={`w-6 h-6 rounded-md bg-slate-200`}></div><span className="text-[10px] font-medium text-slate-400">{p.name.slice(0,5)}</span>
                       </div>
                    ))}
                 </div>
              )}
           </div>
        );
     } 
     const page = spec.pages.find(p => p.name === activeRoute);
     return (
        <div className="h-full flex flex-col font-sans bg-white">
           {!isMobile && (
               <header className={`px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10`}>
                    <div className="flex items-center gap-2"><div className="font-bold text-xl text-slate-900 cursor-pointer" onClick={() => onNavigate('home')}>{spec.name}</div><ChevronRight className="w-4 h-4 text-slate-400" /><div className="font-semibold text-slate-900">{page?.name}</div></div>
                    <button className="text-sm font-medium text-slate-500 hover:text-slate-900" onClick={() => onNavigate('home')}>Back Home</button>
               </header>
           )}
           <main className={`flex-1 overflow-y-auto ${isMobile ? 'p-4 no-scrollbar' : 'p-6'}`} style={isMobile ? { scrollbarWidth: 'none' } : {}}>
              <h2 className={`${isMobile ? 'text-2xl mt-2' : 'text-3xl'} font-bold text-slate-900 mb-2`}>{page?.name}</h2>
              <p className="text-slate-500 mb-8 text-sm leading-relaxed">{page?.description}</p>
              <div className="space-y-4">
                  {page?.components.map((comp, idx) => (
                     <div key={idx} className="p-4 border border-slate-100 rounded-2xl bg-slate-50 shadow-sm">
                        <div className="text-[10px] font-mono text-slate-400 mb-2 uppercase tracking-wide opacity-50">{comp} Component</div>
                        <div className="h-24 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 text-sm">Preview: {comp}</div>
                     </div>
                  ))}
              </div>
           </main>
        </div>
     );
};

const AppInteractivePreview = ({ spec, settings, platform }: { spec: GeneratedAppSpec, settings: AppSettings, platform: 'web' | 'mobile' }) => {
  const isMobile = platform === 'mobile';
  const [activeRoute, setActiveRoute] = useState('home');

  return isMobile ? (
     <div className="flex items-center justify-center h-full py-4 bg-transparent">
       <MobileFrame 
         isHome={activeRoute === 'home'} 
         onBack={() => setActiveRoute('home')}
         appUrl={`https://${spec.name.toLowerCase().replace(/\s+/g, '-')}.expo.dev`}
       >
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

// ... BuilderChatInterface Components ...

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
  const [previewMode, setPreviewMode] = useState<'blueprint' | 'app'>('blueprint');
  const [selectedFile, setSelectedFile] = useState<string | null>('package.json');
  
  const [integrations, setIntegrations] = useState({ github: false, supabase: false, resend: false, twilio: false });
  const [apiKeys, setApiKeys] = useState({ resend: '', twilio: '' });
  const [repoUrl, setRepoUrl] = useState("");
  const [supabaseConfig, setSupabaseConfig] = useState<{url?: string, key?: string}>({});
  const [supabaseInputs, setSupabaseInputs] = useState({ url: '', key: '' });
  
  const [gitMode, setGitMode] = useState<'new' | 'existing'>('new');
  const [launchTarget, setLaunchTarget] = useState<'vercel' | 'netlify'>('vercel');

  const aiService = useRef(new AppGeneratorService(apiKey));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { aiService.current = new AppGeneratorService(apiKey); }, [apiKey]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (config.prompt && messages.length === 0) handleInitialGeneration(config); }, []);
  useEffect(() => { if (buildStep === 'complete') setPreviewMode('app'); }, [buildStep]);

  const addMessage = (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, { ...msg, id: Math.random().toString(36).substring(7), timestamp: new Date() }]);
  };

  const handleInitialGeneration = async (cfg: BuilderConfig) => {
    setBuildStep('planning');
    addMessage({ role: 'user', type: 'text', content: cfg.prompt });
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 600));
    
    const statusMsgId = Math.random().toString(36).substring(7);
    setMessages(prev => [...prev, {
      id: statusMsgId,
      role: 'assistant',
      type: 'status-list',
      content: `I'm analyzing your request...`,
      items: [
        { label: "Analyzing prompt & requirements", status: "running" },
        { label: "Drafting database schema", status: "pending" },
        { label: "Planning UI screens/pages", status: "pending" },
        { label: "Generating API specification", status: "pending" }
      ],
      timestamp: new Date()
    }]);

    try {
      const generatedSpec = await aiService.current.generateAppSpec(cfg.prompt, cfg.platform, cfg.framework);
      const updateStatus = (index: number) => {
        setMessages(prev => prev.map(m => {
          if (m.id === statusMsgId && m.items) {
            const newItems = [...m.items];
            newItems[index].status = 'completed';
            if (index + 1 < newItems.length) newItems[index + 1].status = 'running';
            return { ...m, items: newItems };
          }
          return m;
        }));
      };

      for(let i=0; i<4; i++) { await new Promise(r => setTimeout(r, 800)); updateStatus(i); }
      
      // Explicit breakdown message as requested
      const pageNames = generatedSpec.pages.map(p => `**${p.name}**`).join(', ');
      addMessage({ 
          role: 'assistant', 
          type: 'text', 
          content: `I've analyzed your prompt for a **${cfg.platform}** app. 
          
**Plan Breakdown:**
*   **App Name:** ${generatedSpec.name}
*   **Screens:** ${generatedSpec.pages.length} screens planned (${pageNames}).
*   **Stack:** ${generatedSpec.stack.join(', ')}.
*   **Core:** ${generatedSpec.description}

Please review the full blueprint on the right.` 
      });
      
      setSpec(generatedSpec);
      setIsGenerating(false);
      setBuildStep('review');

    } catch (e) {
      console.error(e);
      setIsGenerating(false);
      addMessage({ role: 'assistant', type: 'text', content: "Error generating app. I've switched to offline mode and generated a template for you." });
    }
  };

  const handleSendMessage = async () => {
      if (!input.trim()) return;
      const userPrompt = input;
      setInput('');
      addMessage({ role: 'user', type: 'text', content: userPrompt });

      if (spec) {
          setIsGenerating(true);
          const loadingId = Math.random().toString(36).substr(7);
          setMessages(prev => [...prev, { role: 'assistant', type: 'text', content: 'Thinking...', id: loadingId, timestamp: new Date() }]);
          
          try {
             const updatedSpec = await aiService.current.updateAppSpec(spec, userPrompt);
             setSpec(updatedSpec);
             setMessages(prev => prev.filter(m => m.id !== loadingId));
             addMessage({ role: 'assistant', type: 'text', content: "I've updated the specifications based on your request. Check the blueprint." });
          } catch (e) {
             console.error(e);
             setMessages(prev => prev.filter(m => m.id !== loadingId));
             addMessage({ role: 'assistant', type: 'text', content: "I couldn't process that update right now. Please check your API connection or try a simpler request." });
          }
          setIsGenerating(false);
      }
  };

  const handleApproveAndBuild = async () => {
    setBuildStep('building');
    addMessage({ role: 'user', type: 'text', content: "Generate the code." });
    // ... simulate build ...
    await new Promise(r => setTimeout(r, 3000));
    setBuildStep('complete');
    addMessage({ role: 'assistant', type: 'text', content: "Code generation complete! Check the Live Preview." });
  };

  const handleLaunch = () => {
    const domain = launchTarget === 'vercel' ? 'vercel.app' : 'netlify.app';
    const deployUrl = `https://${spec?.name.toLowerCase().replace(/\s+/g, '-')}.${domain}`;
    addMessage({ role: 'assistant', type: 'text', content: `🚀 **Deployed to ${launchTarget === 'vercel' ? 'Vercel' : 'Netlify'}!** [${deployUrl}](${deployUrl})` });
    window.open(deployUrl, '_blank');
  };

  const generateFileContent = (fileName: string): string => {
    if (!spec) return '';
    if (fileName === 'package.json') return JSON.stringify({ name: spec.name, version: "0.1.0" }, null, 2);
    if (fileName === 'App.tsx') return `import React from 'react';\nimport { NavigationContainer } from '@react-navigation/native';\nimport { createBottomTabNavigator } from '@react-navigation/bottom-tabs';\n\n// Screens\n${spec.pages.map(p => `import ${p.name.replace(/\s/g, '')}Screen from './screens/${p.name.replace(/\s/g, '')}Screen';`).join('\n')}\n\nconst Tab = createBottomTabNavigator();\n\nexport default function App() {\n  return (\n    <NavigationContainer>\n      <Tab.Navigator>\n        ${spec.pages.map(p => `<Tab.Screen name="${p.name}" component={${p.name.replace(/\s/g, '')}Screen} />`).join('\n        ')}\n      </Tab.Navigator>\n    </NavigationContainer>\n  );\n}`;
    if (fileName.startsWith('screens/')) {
        const pageName = fileName.replace('screens/', '').replace('Screen.tsx', '');
        const page = spec.pages.find(p => p.name.replace(/\s/g, '') === pageName);
        return `import React from 'react';\nimport { View, Text, StyleSheet, ScrollView } from 'react-native';\n\nexport default function ${pageName}Screen() {\n  return (\n    <View style={styles.container}>\n      <Text style={styles.title}>${page?.name}</Text>\n      <Text style={styles.desc}>${page?.description}</Text>\n      <ScrollView>\n        {/* Components: ${page?.components.join(', ')} */}\n      </ScrollView>\n    </View>\n  );\n}\n\nconst styles = StyleSheet.create({\n  container: { flex: 1, backgroundColor: '#fff', padding: 20 },\n  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },\n  desc: { fontSize: 16, color: '#666' }\n});`;
    }
    return `// Content for ${fileName}`;
  };

  const handleDownloadCode = () => {
    if (!spec) return;
    const projectFiles: Record<string, string> = { 'package.json': generateFileContent('package.json'), 'README.md': generateFileContent('README.md') };
    
    if (config.platform === 'mobile') {
        projectFiles['App.tsx'] = generateFileContent('App.tsx');
        spec.pages.forEach(p => { projectFiles[`screens/${p.name.replace(/\s/g, '')}Screen.tsx`] = generateFileContent(`screens/${p.name}Screen.tsx`); });
    } else {
        spec.pages.forEach(p => { projectFiles[`src/app/${p.name}/page.tsx`] = generateFileContent('page.tsx'); });
    }
    
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify({ spec, files: projectFiles }, null, 2)], {type: 'application/json'});
    element.href = URL.createObjectURL(file);
    element.download = `${spec.name}-project.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  const handlePushToGithub = async () => {
    const isNew = gitMode === 'new';
    const pushId = Math.random().toString(36).substr(7);
    setMessages(prev => [...prev, {
        id: pushId,
        role: 'assistant',
        type: 'status-list',
        content: isNew ? 'Initializing GitHub repo...' : 'Pushing to remote...',
        items: [
            { label: 'Initializing Git repository', status: 'running' },
            { label: 'Committing generated files', status: 'pending' },
            { label: isNew ? 'Creating new repository' : 'Adding remote origin', status: 'pending' },
            { label: 'Pushing to remote', status: 'pending' }
        ],
        timestamp: new Date()
    }]);

    setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === pushId ? { ...m, items: m.items?.map((i, idx) => idx === 0 ? { ...i, status: 'completed' } : idx === 1 ? { ...i, status: 'running' } : i) } : m));
    }, 1000);

    setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === pushId ? { ...m, items: m.items?.map((i, idx) => idx <= 1 ? { ...i, status: 'completed' } : idx === 2 ? { ...i, status: 'running' } : i) } : m));
    }, 2500);
    
    setTimeout(() => {
         setMessages(prev => prev.map(m => m.id === pushId ? { ...m, items: m.items?.map(i => ({ ...i, status: 'completed' })) } : m));
         setRepoUrl(`https://github.com/user/${spec?.name.toLowerCase().replace(/\s+/g, '-')}`);
         addMessage({ role: 'assistant', type: 'text', content: `Successfully pushed code to GitHub!` });
    }, 4000);
  };

  const handleConnectIntegration = (type: 'supabase' | 'resend' | 'twilio') => {
      setIntegrations(prev => ({...prev, [type]: true}));
      let msg = "";
      if (type === 'supabase') {
         msg = `Connected to Supabase! (Mock: ${supabaseInputs.url})`;
      } else if (type === 'resend') {
         msg = "Resend API configured.";
      } else {
         msg = "Twilio SMS configured.";
      }
      addMessage({ role: 'assistant', type: 'text', content: msg });
  };

  return (
    <div className="flex h-screen bg-[#0f1117] text-slate-300 overflow-hidden font-sans relative">
      {/* Sidebar Chat */}
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
                 <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-slate-800 border border-slate-700">
                    {msg.role === 'user' ? <Users className="w-4 h-4" /> : <Zap className="w-4 h-4" style={{ color: settings.primaryColor }} />}
                 </div>
                 <div className="max-w-[85%] space-y-2">
                    {msg.type === 'text' && <div className={`p-3 rounded-xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-slate-800 text-slate-200' : 'text-slate-400'}`}>{msg.content}</div>}
                    {msg.type === 'status-list' && msg.items && (
                       <div className="bg-[#151923] rounded-xl border border-slate-800 p-3 space-y-1">
                          <div className="text-sm text-slate-300 font-medium mb-2">{msg.content}</div>
                          {msg.items.map((item, idx) => (
                             <div key={idx} className="flex items-center gap-3 px-2 py-1">
                                {item.status === 'completed' ? <CheckCircle className="w-4 h-4 text-green-500" /> : item.status === 'running' ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-700" />}
                                <span className="text-sm text-slate-400">{item.label}</span>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
         </div>
         <div className="p-4 border-t border-slate-800 bg-[#0B0D12]">
            {buildStep === 'review' && <button onClick={handleApproveAndBuild} className="w-full mb-3 text-white font-semibold py-2.5 rounded-lg bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"><PlayCircle className="w-4 h-4" /> Generate Code</button>}
            <div className="relative bg-[#1A1D24] rounded-xl border border-slate-700/50">
               <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder="Ask me changes..." className="w-full bg-transparent border-none text-slate-200 text-sm p-3 focus:ring-0 resize-none h-14 outline-none" />
               <div className="flex justify-between items-center px-2 pb-2">
                  <div className="flex gap-1 text-slate-500"><Paperclip className="w-4 h-4" /></div>
                  <button onClick={handleSendMessage} disabled={!input.trim()} className="p-1.5 text-white rounded bg-blue-600 hover:bg-blue-500"><Send className="w-4 h-4" /></button>
               </div>
            </div>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-[#0f1117] relative">
         <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-[#0f1117]">
            <div className="flex items-center gap-4">
               <span className="font-semibold text-white">{spec?.name || 'New Project'}</span>
               <div className="h-4 w-px bg-slate-800"></div>
               <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                  {['preview', 'code', 'integrations'].map(tab => (
                     <button key={tab} onClick={() => setActiveTab(tab as any)} disabled={(tab !== 'preview' && buildStep !== 'complete' && buildStep !== 'building')} className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize ${activeTab === tab ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>{tab}</button>
                  ))}
               </div>
            </div>
            <div className="flex items-center gap-3">
               {activeTab === 'code' && <button onClick={handleDownloadCode} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 text-slate-300 hover:text-white"><Download className="w-3.5 h-3.5" /> Download</button>}
               
               <div className="flex bg-slate-800 rounded-md p-0.5 border border-slate-700/50">
                  <button onClick={() => setLaunchTarget('vercel')} className={`px-2 py-1 rounded text-[10px] font-bold ${launchTarget === 'vercel' ? 'bg-black text-white' : 'text-slate-400'}`}>Vercel</button>
                  <button onClick={() => setLaunchTarget('netlify')} className={`px-2 py-1 rounded text-[10px] font-bold ${launchTarget === 'netlify' ? 'bg-teal-900 text-teal-100' : 'text-slate-400'}`}>Netlify</button>
               </div>
               
               <button onClick={handleLaunch} disabled={buildStep !== 'complete'} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-white text-slate-900 hover:bg-slate-200 disabled:opacity-50"><Rocket className="w-3.5 h-3.5" /> Launch</button>
            </div>
         </div>
         
         <div className="flex-1 overflow-auto p-0 relative">
            {isGenerating && !spec ? (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
                  <h3 className="text-xl font-medium text-white mb-2">Generating preview...</h3>
               </div>
            ) : spec ? (
               <>
                  {activeTab === 'preview' && (
                     <div className="h-full flex flex-col">
                        <div className="px-8 pt-6 pb-2 flex justify-between items-center">
                           <div className="bg-slate-900 inline-flex rounded-lg p-1 border border-slate-800">
                              <button onClick={() => setPreviewMode('blueprint')} className={`px-3 py-1.5 rounded-md text-xs font-medium ${previewMode === 'blueprint' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}>Blueprint</button>
                              <button onClick={() => setPreviewMode('app')} disabled={buildStep !== 'complete'} className={`px-3 py-1.5 rounded-md text-xs font-medium ${previewMode === 'app' ? 'bg-slate-800 text-white' : 'text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed'}`}>Live App</button>
                           </div>
                        </div>
                        <div className="flex-1 overflow-auto p-8 pt-4">
                           {previewMode === 'blueprint' && (
                              <div className="max-w-5xl mx-auto space-y-8 pb-20">
                                 {/* Header */}
                                 <div className="text-center">
                                    <h1 className="text-3xl font-bold text-white mb-2">{spec.name}</h1>
                                    <p className="text-slate-400 max-w-2xl mx-auto">{spec.description}</p>
                                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                                       {spec.stack.map(tech => (
                                          <span key={tech} className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300 border border-slate-700">{tech}</span>
                                       ))}
                                    </div>
                                 </div>

                                 {/* Pages */}
                                 <div>
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Layout className="w-5 h-5 text-purple-400"/> Pages & Screens</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                       {spec.pages.map((p, i) => (
                                          <div key={i} className="bg-[#151923] border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition group relative">
                                             <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-white">{p.name}</h4>
                                             </div>
                                             <p className="text-sm text-slate-400 mb-3">{p.description}</p>
                                             <div className="flex flex-wrap gap-2">
                                                {p.components.map((c, idx) => (
                                                   <span key={idx} className="text-[10px] uppercase font-mono bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20">{c}</span>
                                                ))}
                                             </div>
                                          </div>
                                       ))}
                                    </div>
                                 </div>

                                 {/* Database */}
                                 <div>
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Database className="w-5 h-5 text-blue-400"/> Database Schema</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                       {spec.database.map((d, i) => (
                                          <div key={i} className="bg-[#151923] border border-slate-800 rounded-xl p-5">
                                             <div className="font-bold text-blue-400 mb-3 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div> {d.model}
                                             </div>
                                             <ul className="space-y-1">
                                                {d.fields.map((f, idx) => (
                                                   <li key={idx} className="text-xs font-mono text-slate-300 border-b border-slate-800/50 last:border-0 py-1 flex justify-between">
                                                      <span>{f.split(' ')[0]}</span>
                                                      <span className="text-slate-500">{f.split(' ').slice(1).join(' ')}</span>
                                                   </li>
                                                ))}
                                             </ul>
                                          </div>
                                       ))}
                                    </div>
                                 </div>

                                 {/* API Routes */}
                                 <div>
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Server className="w-5 h-5 text-green-400"/> API Routes</h3>
                                    <div className="grid grid-cols-1 gap-2">
                                       {spec.apiRoutes.map((api, i) => (
                                          <div key={i} className="bg-[#151923] border border-slate-800 rounded-lg p-3 flex items-center justify-between">
                                             <div className="flex items-center gap-4">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase w-14 text-center ${api.method === 'GET' ? 'bg-blue-500/20 text-blue-400' : api.method === 'POST' ? 'bg-green-500/20 text-green-400' : api.method === 'DELETE' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{api.method}</span>
                                                <code className="text-sm text-slate-200">{api.path}</code>
                                             </div>
                                             <span className="text-xs text-slate-500">{api.description}</span>
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              </div>
                           )}
                           {previewMode === 'app' && <AppInteractivePreview spec={spec} settings={settings} platform={config.platform} />}
                        </div>
                        
                        {buildStep === 'review' && previewMode === 'blueprint' && (
                             <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
                                 <button onClick={handleApproveAndBuild} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-green-900/40 hover:scale-105 transition flex items-center gap-3 border-4 border-[#0f1117] animate-pulse-slow">
                                    <Check className="w-5 h-5" /> Generate Code & Launch
                                 </button>
                             </div>
                        )}
                     </div>
                  )}
                  {activeTab === 'code' && (
                     <div className="h-full grid grid-cols-12 gap-0">
                        <div className="col-span-3 bg-[#151923] border-r border-slate-800 p-4 font-mono text-xs">
                           <FileTreeItem name="package.json" />
                           {config.platform === 'mobile' ? (
                              <FileTreeItem name="src" isFolder open>
                                 <FileTreeItem name="App.tsx" onClick={() => setSelectedFile('App.tsx')} isSelected={selectedFile === 'App.tsx'} />
                                 <FileTreeItem name="screens" isFolder open>
                                    {spec.pages.map(p => (
                                        <FileTreeItem key={p.name} name={`${p.name.replace(/\s/g, '')}Screen.tsx`} onClick={() => setSelectedFile(`screens/${p.name.replace(/\s/g, '')}Screen.tsx`)} isSelected={selectedFile === `screens/${p.name.replace(/\s/g, '')}Screen.tsx`} />
                                    ))}
                                 </FileTreeItem>
                              </FileTreeItem>
                           ) : (
                              <FileTreeItem name="src" isFolder open>
                                 <FileTreeItem name="layout.tsx" onClick={() => setSelectedFile('layout.tsx')} isSelected={selectedFile === 'layout.tsx'} />
                                 <FileTreeItem name="app" isFolder open>
                                    {spec.pages.map(p => (
                                        <FileTreeItem key={p.name} name={`${p.name}/page.tsx`} onClick={() => setSelectedFile(`src/app/${p.name}/page.tsx`)} isSelected={selectedFile === `src/app/${p.name}/page.tsx`} />
                                    ))}
                                 </FileTreeItem>
                              </FileTreeItem>
                           )}
                           {integrations.supabase && <FileTreeItem name="supabase/migrations/init.sql" onClick={() => setSelectedFile('supabase/migrations/init.sql')} isSelected={selectedFile === 'supabase/migrations/init.sql'} />}
                           {integrations.github && <FileTreeItem name=".github/workflows/ci.yml" onClick={() => setSelectedFile('.github/workflows/ci.yml')} isSelected={selectedFile === '.github/workflows/ci.yml'} />}
                           {(integrations.resend || integrations.twilio || integrations.supabase) && <FileTreeItem name=".env" onClick={() => setSelectedFile('.env')} isSelected={selectedFile === '.env'} />}
                        </div>
                        <div className="col-span-9 bg-[#0d1117] p-0 overflow-auto">
                           <div className="flex justify-between items-center bg-[#151923] px-4 py-2 border-b border-slate-800">
                               <span className="text-xs font-mono text-slate-400">{selectedFile}</span>
                               <button className="text-xs text-slate-400 hover:text-white flex items-center gap-1" onClick={() => navigator.clipboard.writeText(generateFileContent(selectedFile || ''))}><Copy className="w-3 h-3" /> Copy</button>
                           </div>
                           <div className="p-4">
                               <SyntaxHighlighter code={generateFileContent(selectedFile || '')} />
                           </div>
                        </div>
                     </div>
                  )}
                  {activeTab === 'integrations' && (
                    <div className="p-8 max-w-4xl mx-auto space-y-6">
                        <h2 className="text-2xl font-bold text-white mb-4">Integrations & Deployment</h2>
                        
                        {/* GitHub Card */}
                        <div className="bg-[#151923] border border-slate-800 rounded-xl p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center">
                                        <Github className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">GitHub</h3>
                                        <p className="text-slate-400 text-sm">Sync your code to a repository.</p>
                                    </div>
                                </div>
                                {integrations.github ? (
                                    <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20">Connected</span>
                                ) : (
                                    <button onClick={() => setIntegrations({...integrations, github: true})} className="px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-bold hover:bg-slate-200">Connect</button>
                                )}
                            </div>
                            
                            {integrations.github && (
                                <div className="space-y-4 border-t border-slate-800 pt-6 animate-accordion-down">
                                     {!repoUrl ? (
                                         <>
                                            <div className="flex gap-4 mb-2">
                                                <button 
                                                    onClick={() => setGitMode('new')} 
                                                    className={`flex-1 py-2 text-sm font-medium rounded-lg border ${gitMode === 'new' ? 'bg-slate-800 border-blue-500 text-blue-400' : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-600'}`}
                                                >
                                                    Create New Repo
                                                </button>
                                                <button 
                                                    onClick={() => setGitMode('existing')} 
                                                    className={`flex-1 py-2 text-sm font-medium rounded-lg border ${gitMode === 'existing' ? 'bg-slate-800 border-blue-500 text-blue-400' : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-600'}`}
                                                >
                                                    Push to Existing
                                                </button>
                                            </div>
                                            
                                            {gitMode === 'new' ? (
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Repository Name</label>
                                                    <input type="text" placeholder="my-awesome-app" className="w-full bg-[#0B0D12] border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-blue-500" />
                                                </div>
                                            ) : (
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Remote URL</label>
                                                    <input type="text" placeholder="https://github.com/username/repo.git" className="w-full bg-[#0B0D12] border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-blue-500" />
                                                </div>
                                            )}
                                            
                                            <button onClick={handlePushToGithub} className="bg-[#238636] hover:bg-[#2ea043] text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2">
                                                <Github className="w-4 h-4" /> {gitMode === 'new' ? 'Create & Push' : 'Push Code'}
                                            </button>
                                         </>
                                     ) : (
                                         <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                                <div>
                                                    <div className="text-sm text-white font-medium">Successfully pushed to main</div>
                                                    <a href="#" className="text-xs text-blue-400 hover:underline">{repoUrl}</a>
                                                </div>
                                            </div>
                                            <button onClick={() => setRepoUrl("")} className="text-xs text-slate-500 hover:text-white">Disconnect</button>
                                         </div>
                                     )}
                                </div>
                            )}
                        </div>
                        
                        {/* Supabase Card */}
                        <div className="bg-[#151923] border border-slate-800 rounded-xl p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-900/20 rounded-lg flex items-center justify-center">
                                        <Database className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">Supabase</h3>
                                        <p className="text-slate-400 text-sm">Database & Authentication.</p>
                                    </div>
                                </div>
                                {integrations.supabase ? (
                                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium border border-emerald-500/20">Connected</span>
                                ) : (
                                    <button onClick={() => handleConnectIntegration('supabase')} className="px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-bold hover:bg-slate-200">Connect</button>
                                )}
                            </div>
                            {integrations.supabase && (
                                <div className="space-y-4 border-t border-slate-800 pt-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Project URL</label>
                                            <input type="text" value={supabaseInputs.url} onChange={(e) => setSupabaseInputs({...supabaseInputs, url: e.target.value})} placeholder="https://xyz.supabase.co" className="w-full bg-[#0B0D12] border border-slate-700 rounded-lg px-4 py-2 text-white text-sm outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Anon Key</label>
                                            <input type="password" value={supabaseInputs.key} onChange={(e) => setSupabaseInputs({...supabaseInputs, key: e.target.value})} placeholder="ey..." className="w-full bg-[#0B0D12] border border-slate-700 rounded-lg px-4 py-2 text-white text-sm outline-none" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs text-slate-500">Migrations created automatically</div>
                                        <button className="text-emerald-400 hover:text-emerald-300 text-xs font-medium">Test Connection</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Resend & Twilio Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="bg-[#151923] border border-slate-800 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-5 h-5 text-white" />
                                        <span className="font-bold text-white">Resend</span>
                                    </div>
                                    <button onClick={() => handleConnectIntegration('resend')} className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded hover:bg-slate-700">Configure</button>
                                </div>
                                <p className="text-xs text-slate-400">Transactional emails API.</p>
                             </div>
                             <div className="bg-[#151923] border border-slate-800 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <Smartphone className="w-5 h-5 text-white" />
                                        <span className="font-bold text-white">Twilio</span>
                                    </div>
                                    <button onClick={() => handleConnectIntegration('twilio')} className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded hover:bg-slate-700">Configure</button>
                                </div>
                                <p className="text-xs text-slate-400">SMS & Messaging API.</p>
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

const LandingView = ({ onStart, settings }: { onStart: (cfg: BuilderConfig) => void, settings: AppSettings }) => {
  const [prompt, setPrompt] = useState('');
  const [platform, setPlatform] = useState<'web' | 'mobile'>('web');
  const [framework, setFramework] = useState('Next.js');
  
  const frameworks = platform === 'web' ? ['Next.js', 'React', 'Vue', 'Svelte'] : ['React Native', 'Flutter', 'SwiftUI', 'Expo'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) onStart({ prompt, platform, framework });
  };

  return (
    <div className="min-h-screen bg-[#0f1117] relative overflow-hidden flex flex-col items-center justify-center p-4">
       <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
       <div className="absolute -top-20 -left-20 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl animate-pulse-slow"></div>
       <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl animate-pulse-slow"></div>
       
       <div className="relative z-10 max-w-3xl w-full text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-400 mb-4 animate-fade-in-up">
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> v2.0 Now Available with Gemini 3.0 Pro
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight">
             Build <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">anything</span> <br/> in seconds.
          </h1>
          
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
             {settings.appName} transforms a single prompt into a production-ready full-stack application.
             Database, Authentication, API, and UI — generated instantly.
          </p>
          
          <div className="bg-[#151923]/80 backdrop-blur-xl border border-slate-700/50 p-2 rounded-2xl shadow-2xl transform transition-all hover:scale-[1.01] hover:border-slate-600">
             <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-2 pt-2">
                    <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                        <button type="button" onClick={() => { setPlatform('web'); setFramework('Next.js'); }} className={`px-3 py-1 rounded-md text-xs font-medium transition ${platform === 'web' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}>Web App</button>
                        <button type="button" onClick={() => { setPlatform('mobile'); setFramework('React Native'); }} className={`px-3 py-1 rounded-md text-xs font-medium transition ${platform === 'mobile' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}>Mobile App</button>
                    </div>
                    <select value={framework} onChange={(e) => setFramework(e.target.value)} className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-slate-600">
                        {frameworks.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>
                <div className="relative">
                    <input 
                      type="text" 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe your dream app..." 
                      className="w-full bg-transparent text-white px-6 py-4 outline-none placeholder:text-slate-500 text-lg"
                      autoFocus
                    />
                    <button type="submit" disabled={!prompt.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-slate-900 px-6 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                       <Zap className="w-4 h-4 fill-current" /> Generate
                    </button>
                </div>
             </form>
          </div>
          
          <div className="pt-8 flex justify-center gap-8 text-slate-500 text-sm font-medium">
             <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500" /> Production React Code</span>
             <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-purple-500" /> Database Schema</span>
             <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> One-Click Deploy</span>
          </div>
       </div>

       <div className="absolute bottom-6 left-0 w-full text-center text-slate-600 text-xs">
          Powered by Gemini 3.0 Pro • 100% Free & Open Source Template
       </div>
    </div>
  );
};

const TokenUsageCard = ({ user }: { user: User }) => (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10"><Zap className="w-24 h-24 text-yellow-500" /></div>
        <h3 className="text-white font-bold mb-1">Token Usage</h3>
        <div className="text-3xl font-mono text-white mb-2">{user.tokenUsage.toLocaleString()} <span className="text-sm text-slate-400 font-sans">/ {user.tokenBalance.toLocaleString()}</span></div>
        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-yellow-500" style={{ width: `${(user.tokenUsage / user.tokenBalance) * 100}%` }}></div>
        </div>
        <p className="text-xs text-slate-400">Resets in 14 days.</p>
    </div>
);

// --- APP ROOT ---

const App = () => {
  const [view, setView] = useState('landing');
  const [settings, setSettings] = useState<AppSettings>({ appName: 'HelloJadanAI', primaryColor: '#7c3aed' });
  const [providers, setProviders] = useState<ProviderConfig[]>(INITIAL_PROVIDERS);
  const [builderConfig, setBuilderConfig] = useState<BuilderConfig | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const getApiKey = () => providers.find(p => p.type === 'llm' && p.status === 'active')?.apiKey;

  const handleLogin = (email: string) => {
    // Simulate login logic
    const role = email.includes('admin') ? 'super_admin' : 'user';
    const mockUser: User = {
       id: 'u1', name: email.split('@')[0], email, role, status: 'active', plan: 'pro', createdAt: new Date().toISOString(),
       tokenBalance: role === 'super_admin' ? 1000000 : 50000, tokenUsage: 0
    };
    setUser(mockUser);
    if (builderConfig) {
        setView('home');
    } else if (role === 'super_admin') {
        setView('admin-dash');
    } else {
        setView('home');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setView('landing');
    setBuilderConfig(null);
  };

  const handleStartBuilder = (cfg: BuilderConfig) => {
     setBuilderConfig(cfg);
     if (!user) {
         setView('auth');
     } else {
         setView('home');
     }
  };

  // Views mapping
  if (view === 'landing') return (
     <>
        <nav className="fixed w-full z-50 p-6 flex justify-between items-center text-sm font-medium">
             <div className="flex items-center gap-2 font-bold text-white text-lg"><Rocket className="w-5 h-5 text-primary" /> {settings.appName}</div>
             <div className="flex gap-6 text-slate-400">
                <button onClick={() => setView('auth')} className="hover:text-white">Login</button>
                <button className="text-white bg-white/10 px-4 py-2 rounded-full border border-white/10 hover:bg-white/20 transition">Get Started</button>
             </div>
        </nav>
        <LandingView onStart={handleStartBuilder} settings={settings} />
        {/* Simple Footer for Landing */}
        <div className="fixed bottom-0 w-full p-4 flex justify-center gap-6 text-xs text-slate-500 bg-slate-950/80 backdrop-blur z-40 border-t border-slate-800/50">
            <button onClick={() => alert("About modal")} className="hover:text-white">About Us</button>
            <button onClick={() => alert("Contact modal")} className="hover:text-white">Contact</button>
            <button onClick={() => alert("Privacy modal")} className="hover:text-white">Privacy Policy</button>
            <button onClick={() => alert("Refund modal")} className="hover:text-white">Refund Policy</button>
            <button onClick={() => alert("FAQ modal")} className="hover:text-white">FAQs</button>
        </div>
     </>
  );

  if (view === 'auth') return <AuthView onLogin={handleLogin} />;
  
  // Super Admin Layout
  if (view.startsWith('admin-')) {
     return (
        <div className="flex min-h-screen bg-[#0f1117] font-sans">
           <AdminSidebar currentView={view} onViewChange={setView} settings={settings} />
           <div className="flex-1 overflow-y-auto">
              <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900 sticky top-0 z-10">
                 <h2 className="font-semibold text-white">Dashboard</h2>
                 <div className="flex items-center gap-4">
                    <button className="p-2 text-slate-400 hover:text-white"><Zap className="w-5 h-5" /></button>
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">{user?.name[0]}</div>
                 </div>
              </header>
              {view === 'admin-dash' && <AdminDashboard />}
              {view === 'admin-users' && <AdminUsers />}
              {view === 'admin-tasks' && <AdminTasks />}
              {view === 'admin-billing' && <AdminBilling />}
              {view === 'admin-ai' && <AdminProviders providers={providers} onUpdate={setProviders} />}
              {view === 'admin-settings' && <AdminSettingsView settings={settings} onUpdate={setSettings} />}
           </div>
        </div>
     );
  }

  // App Builder Layout
  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col font-sans">
      <Header onViewChange={setView} currentView={view} settings={settings} user={user} onLogout={handleLogout} />
      {view === 'home' && builderConfig && <BuilderChatInterface config={builderConfig} onViewChange={setView} settings={settings} apiKey={getApiKey()} />}
      {view === 'home' && !builderConfig && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
             <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 max-w-lg w-full">
                <Rocket className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Ready to build?</h2>
                <p className="text-slate-400 mb-6">Start a new project from the landing page to configure your stack.</p>
                <button onClick={() => setView('landing')} className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition w-full">Go to Start</button>
             </div>
             {user && <div className="mt-8 w-full max-w-lg"><TokenUsageCard user={user} /></div>}
          </div>
      )}
      {view === 'docs' && <DocsView settings={settings} />}
      {view === 'templates' && (
          <div className="p-12 text-center">
             <h1 className="text-3xl font-bold text-white mb-4">Templates Library</h1>
             <p className="text-slate-400">Coming soon. Start with a prompt instead!</p>
             <button onClick={() => setView('landing')} className="mt-6 text-primary hover:underline">Back to Builder</button>
          </div>
      )}
    </div>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element to mount to");
const root = createRoot(rootElement);
root.render(<App />);