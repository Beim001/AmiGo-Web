import { User, BookOpen, Swords, Map as MapIcon, Briefcase } from 'lucide-react';

// 底部导航：角色、功能、推演、日志、家族五个标签页切换

const TABS = [
  { id: 'role', label: '角色', icon: User, badge: false },
  { id: 'bag', label: '功能', icon: Briefcase, badge: false },
  { id: 'combat', label: '推演', icon: Swords, badge: false },
  { id: 'log', label: '日志', icon: BookOpen, badge: true },
  { id: 'map', label: '家族', icon: MapIcon, badge: false },
];

export const BottomNav = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (id: string) => void }) => {
  return (
    <div className="h-[75px] bg-[#3a3b46] flex relative mt-auto border-t-[3px] border-black z-20">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col justify-center items-center relative border-r-[3px] border-black last:border-r-0 cursor-pointer select-none transition-all duration-200 ease-out overflow-visible ${
              isActive
                ? 'flex-[2.2] bg-[#fcd34d]'
                : 'flex-1 bg-[#474854] hover:bg-[#535669]'
            }`}
          >
            {isActive && (
              <div className="absolute inset-0 opacity-40 pointer-events-none overflow-hidden" style={{ backgroundImage: 'radial-gradient(circle, #f59e0b 2.5px, transparent 2.5px)', backgroundSize: '16px 16px', backgroundPosition: 'center' }}></div>
            )}

            <div className="relative flex flex-col items-center justify-center w-full h-full">
              {/* Icon Container - Lower z-index (z-10) and enlarged icon size */}
              <div className={`relative z-10 transition-all duration-200 ${isActive ? '-translate-y-2 scale-110' : 'translate-y-0 scale-100'}`}>
                <div className="relative">
                  <tab.icon
                    size={isActive ? 38 : 32}
                    className="drop-shadow-[0_2px_0_rgba(0,0,0,0.8)]"
                    fill={isActive ? (tab.id === 'map' ? '#8bc6f4' : tab.id === 'role' ? '#ff6a6a' : tab.id === 'log' ? '#c084fc' : tab.id === 'combat' ? '#a3a3a3' : '#d97706') : '#94a3b8'}
                    stroke="black"
                    strokeWidth={2}
                  />
                  {tab.badge && (
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#ef4444] rounded-full border-[2px] border-black z-20"></div>
                  )}
                </div>
              </div>

              {/* Text Container - Only visible when active, higher z-index (z-20) overlapping bottom of icon */}
              {isActive && (
                <div className="absolute bottom-0.5 z-20 pointer-events-none transition-all duration-200">
                   <span
                     className="text-white font-black text-[13px] sm:text-[14px] tracking-wider block whitespace-nowrap"
                     style={{ textShadow: '-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000, 0 3px 0 #000, 0 0 4px #000' }}
                   >
                     {tab.label}
                   </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
