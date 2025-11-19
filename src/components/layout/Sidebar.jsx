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

export default function Sidebar({ activeTab, onTabClick }) {
  const mainNavItems = [
    { id: 'budget', name: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', name: 'Transactions', icon: FileText }, // Placeholder
    { id: 'savings', name: 'Savings', icon: PiggyBank }, // Placeholder
    { id: 'debts', name: 'Debts', icon: CreditCard },
    { id: 'accounts', name: 'Bank Accounts', icon: Landmark },
    { id: 'reports', name: 'Reports', icon: PieChart },
  ];

  const footerNavItems = [
    { id: 'account', name: 'Account', icon: UserCircle }, // Placeholder
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  const NavItem = ({ item }) => {
    const isActive = activeTab === item.id;
    return (
      <button
        onClick={() => onTabClick(item.id)}
        className={`group flex w-[220px] h-[40px] items-center rounded-lg px-4 text-left transition-all duration-200 ${
          isActive
            ? 'bg-gray-100 text-gray-900'
            : 'bg-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700'
        }`}
      >
        <item.icon
          className={`mr-3 h-5 w-5 ${
            isActive
              ? 'text-gray-900'
              : 'text-gray-400 group-hover:text-gray-500'
          }`}
          strokeWidth={isActive ? 2.5 : 2}
        />
        <span
          className={`text-[15px] font-montserrat ${
            isActive ? 'font-bold' : 'font-normal'
          }`}
        >
          {item.name}
        </span>
      </button>
    );
  };

  return (
    <aside className="sticky top-6 z-30 flex h-[calc(100vh-48px)] w-full flex-col items-center rounded-xl bg-white shadow-[0px_3px_20px_rgba(0,0,0,0.05)]">
      {/* Branding */}
      <div className="mb-10 mt-6 w-full px-8 text-left">
        <h1 className="font-montserrat text-[28px] font-bold tracking-wide text-[#3DDC97]">
          ZILLION
        </h1>
      </div>

      {/* Main Menu */}
      <nav className="flex flex-col gap-[10px]">
        {mainNavItems.map((item) => (
          <NavItem key={item.id} item={item} />
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-grow" />

      {/* Footer Menu */}
      <div className="mb-3 flex w-full flex-col items-center">
        <div className="mb-5 h-[1px] w-[220px] bg-gray-200" />
        <div className="flex flex-col gap-[10px]">
          {footerNavItems.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </aside>
  );
}