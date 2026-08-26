import React from 'react';
import { LayoutGrid, Sliders } from 'lucide-react';

interface EmptyLayoutStateProps {
  sheetName: string;
}

export const EmptyLayoutState: React.FC<EmptyLayoutStateProps> = ({ sheetName }) => {
  const handleOpenOptions = () => {
    window.dispatchEvent(
      new CustomEvent('penpaper_open_options_modal', {
        detail: { category: 'layout' }
      })
    );
  };

  return (
    <div className="bg-stone-950 border border-stone-800 rounded-2xl p-8 sm:p-12 text-center space-y-4 shadow-xl">
      <div className="w-14 h-14 rounded-2xl bg-amber-950/40 border border-amber-600/40 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
        <LayoutGrid className="w-7 h-7" />
      </div>

      <div className="space-y-1 max-w-md mx-auto">
        <h3 className="text-lg font-serif font-bold text-amber-200">
          All {sheetName} Features are Hidden
        </h3>
        <p className="text-xs text-stone-400 leading-relaxed">
          You have deactivated all visual panels on this sheet in your Layout Options. You can re-enable the panels you want to see anytime.
        </p>
      </div>

      <button
        onClick={handleOpenOptions}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow-lg transition transform hover:scale-[1.02] cursor-pointer"
      >
        <Sliders className="w-4 h-4" />
        <span>Customize Sheet Layout</span>
      </button>
    </div>
  );
};
