import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  PiggyBank, 
  CreditCard, 
  Landmark, 
  PieChart, 
  UserCircle, 
  Settings 
} from 'lucide-react';

export default function Sidebar({ activeTab, onTabClick, theme }) {
  const mainNavItems = [
    { id: 'budget', name: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', name: 'Transactions', icon: FileText },
    { id: 'savings', name: 'Savings', icon: PiggyBank },
    { id: 'debts', name: 'Debts', icon: CreditCard },
    { id: 'accounts', name: 'Bank Accounts', icon: Landmark },
    { id: 'reports', name: 'Reports', icon: PieChart },
  ];

  const footerNavItems = [
    { id: 'account', name: 'Account', icon: UserCircle },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  const NavItem = ({ item }) => {
    const isActive = activeTab === item.id;
    return (
      <button
        onClick={() => onTabClick(item.id)}
        className={`group flex w-[220px] h-[44px] items-center rounded-lg px-4 text-left transition-all duration-200 ${
          isActive
            ? 'bg-zillion-50 text-zillion-600 dark:bg-zillion-900/20 dark:text-zillion-400 shadow-sm'
            : `bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200`
        }`}
      >
        <item.icon
          className={`mr-3 h-5 w-5 transition-colors ${
            isActive
              ? 'text-zillion-500 dark:text-zillion-400'
              : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
          }`}
          strokeWidth={isActive ? 2.5 : 2}
        />
        <span
          className={`text-[14px] font-medium ${
            isActive ? 'font-semibold' : 'font-medium'
          }`}
        >
          {item.name}
        </span>
      </button>
    );
  };

  return (
    <aside className={`
      sticky top-6 z-30 flex h-[calc(100vh-48px)] w-full flex-col items-center rounded-3xl 
      border shadow-xl backdrop-blur-xl transition-all duration-500
      ${theme === 'dark' 
        ? 'bg-slate-900/40 border-white/10 shadow-[0_0_40px_-10px_rgba(16,185,129,0.1)]' 
        : 'bg-white/70 border-white/60 shadow-slate-200/50'
      }
    `}>
      {/* Branding */}
      <div className="mb-8 mt-8 w-full px-8 text-left">
        <h1 className="text-2xl font-bold tracking-tight text-zillion-400">
          ZILLION
        </h1>
      </div>

      {/* Main Menu */}
      <nav className="flex flex-col gap-2">
        {mainNavItems.map((item) => (
          <NavItem key={item.id} item={item} />
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-grow" />

      {/* Footer Menu */}
      <div className="mb-6 flex w-full flex-col items-center">
        <div className={`mb-6 h-px w-[220px] ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`} />
        <div className="flex flex-col gap-2">
          {footerNavItems.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </aside>
  );
}