import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { Save, User, Shield, Target, Wallet, AlertCircle, Camera, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/analytics';

interface UserProfileProps {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
}

const UserProfileView: React.FC<UserProfileProps> = ({ profile, onSave }) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update local state if prop changes
  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        // Simple size validation (limit to ~800KB for localStorage safety)
        if (file.size > 800 * 1024) {
            alert("Image is too large. Please select an image under 800KB.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            handleChange('avatarUrl', reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = (e: React.MouseEvent) => {
      e.stopPropagation();
      handleChange('avatarUrl', '');
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const calculatedRiskAmount = (formData.startBalance * formData.maxRiskPerTrade) / 100;
  const calculatedDailyLoss = (formData.startBalance * formData.maxDailyLoss) / 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-2xl font-bold text-slate-100">Trader Profile</h1>
           <p className="text-slate-400">Manage your identity, account parameters, and risk rules.</p>
        </div>
        {isSaved && (
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-900/50">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Saved Successfully
            </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Identity */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-indigo-600/20 rounded-lg text-indigo-400">
                    <User className="w-5 h-5" />
                 </div>
                 <h3 className="font-semibold text-slate-200">Identity</h3>
              </div>
              
              <div className="space-y-4">
                  <div className="flex flex-col items-center mb-6">
                      <div 
                        onClick={handleAvatarClick}
                        className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center border-4 border-slate-600 relative overflow-hidden group cursor-pointer hover:border-indigo-500 transition-colors shadow-lg"
                      >
                          {formData.avatarUrl ? (
                              <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                              <span className="text-2xl font-bold text-slate-400">{formData.name.substring(0,2).toUpperCase()}</span>
                          )}
                          
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-xs text-white">
                              <Camera className="w-5 h-5 mb-1" />
                              <span>Change</span>
                          </div>
                      </div>
                      
                      {/* Hidden Input */}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleFileChange}
                      />

                      {formData.avatarUrl && (
                          <button 
                            type="button"
                            onClick={handleRemoveAvatar}
                            className="mt-2 text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                          >
                              <Trash2 className="w-3 h-3" /> Remove Photo
                          </button>
                      )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Display Name</label>
                    <input 
                        type="text" 
                        required
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                        value={formData.name}
                        onChange={e => handleChange('name', e.target.value)}
                    />
                  </div>

                   <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Account Label</label>
                    <input 
                        type="text" 
                        required
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                        value={formData.accountType}
                        onChange={e => handleChange('accountType', e.target.value)}
                        placeholder="e.g. Pro Account"
                    />
                  </div>

                   <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Bio / Mantra</label>
                    <textarea 
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none h-24 resize-none"
                        value={formData.bio}
                        onChange={e => handleChange('bio', e.target.value)}
                    />
                  </div>
              </div>
           </div>
        </div>

        {/* Right Col: Parameters & Risk */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Account Settings */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-600/20 rounded-lg text-emerald-400">
                        <Wallet className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-slate-200">Account Parameters</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Starting Balance</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-slate-500 font-mono">
                                {formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : '£'}
                            </span>
                            <input 
                                type="number" 
                                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:border-indigo-500 focus:outline-none font-mono"
                                value={formData.startBalance}
                                onChange={e => handleChange('startBalance', Number(e.target.value))}
                            />
                        </div>
                     </div>
                     <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Currency</label>
                        <select 
                            className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            value={formData.currency}
                            onChange={e => handleChange('currency', e.target.value)}
                        >
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                        </select>
                     </div>
                 </div>
            </div>

            {/* Risk Management */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                     <Shield className="w-24 h-24 text-rose-500" />
                 </div>
                 <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="p-2 bg-rose-600/20 rounded-lg text-rose-400">
                        <Shield className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-slate-200">Risk Management Rules</h3>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                     <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Max Risk Per Trade (%)</label>
                        <div className="relative">
                            <input 
                                type="number" step="0.1"
                                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none font-mono mb-2"
                                value={formData.maxRiskPerTrade}
                                onChange={e => handleChange('maxRiskPerTrade', Number(e.target.value))}
                            />
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Limit: {formatCurrency(calculatedRiskAmount, formData.currency)} per trade</span>
                        </div>
                     </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Max Daily Loss (%)</label>
                        <div className="relative">
                             <input 
                                type="number" step="0.1"
                                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none font-mono mb-2"
                                value={formData.maxDailyLoss}
                                onChange={e => handleChange('maxDailyLoss', Number(e.target.value))}
                            />
                        </div>
                         <div className="text-xs text-slate-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Limit: {formatCurrency(calculatedDailyLoss, formData.currency)} per day</span>
                        </div>
                     </div>
                 </div>
                 <div className="mt-4 p-3 bg-rose-900/10 border border-rose-900/30 rounded-lg text-xs text-rose-300">
                    Trades violating these rules will be flagged automatically in your journal.
                 </div>
            </div>

            {/* Goals */}
             <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-600/20 rounded-lg text-indigo-400">
                        <Target className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-slate-200">Performance Goals</h3>
                 </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Monthly Profit Target (%)</label>
                    <div className="flex items-center gap-4">
                        <div className="relative w-32">
                             <input 
                                type="number" step="0.5"
                                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none font-mono"
                                value={formData.monthlyGoal}
                                onChange={e => handleChange('monthlyGoal', Number(e.target.value))}
                            />
                            <span className="absolute right-3 top-2 text-slate-500 text-sm">%</span>
                        </div>
                        
                        {/* Visual Progress Bar (Aggressiveness Meter) */}
                        <div className="flex-1 flex flex-col gap-1">
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-indigo-500 transition-all duration-500 ease-out" 
                                    style={{ width: `${Math.min(formData.monthlyGoal * 2, 100)}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                                <span>Conservative</span>
                                <span>Aggressive</span>
                            </div>
                        </div>
                    </div>
                 </div>
            </div>

             <div className="flex justify-end pt-4">
                <button 
                    type="submit"
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-indigo-900/50"
                >
                    <Save className="w-5 h-5" />
                    Save Profile
                </button>
            </div>
        </div>

      </form>
    </div>
  );
};

export default UserProfileView;