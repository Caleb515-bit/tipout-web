'use client';
import { useState, useRef, useEffect, Suspense } from 'react';
import { SlidersHorizontal, ArrowRight, Clock, ShieldCheck, ArrowLeft, Trash2, Plus, Download, Check, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { toPng } from 'html-to-image';
import { signIn, useSession } from 'next-auth/react';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { useSearchParams } from 'next/navigation';

function PaymentHandler({ onPaymentSuccess }: { onPaymentSuccess: () => void }) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      onPaymentSuccess();
    }
  }, [searchParams]);

  return null;
}

export default function TipOutApp() {
  const { data: session, update } = useSession();
  const isPro = (session?.user as any)?.isPro || false;

  const [currentScreen, setCurrentScreen] = useState<'home' | 'new-split' | 'breakdown' | 'roster-weights' | 'pro'>('home');
  const [currency, setCurrency] = useState('USD');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [totalTips, setTotalTips] = useState('');
  const [splitMethod, setSplitMethod] = useState('Role × Hours');
  const [errorMessage, setErrorMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  
  // Soft cloud reassurance modal state for checkout
  const [showSoftCloudModal, setShowSoftCloudModal] = useState(false);
  
  // Pro Screen State
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');
  
  const [staffList, setStaffList] = useState([
    { id: 1, name: 'Alex M.', role: 'Server', hours: '6' },
    { id: 2, name: 'Jordan K.', role: 'Bartender', hours: '8' },
    { id: 3, name: 'Sam T.', role: 'Busser', hours: '5' },
  ]);

  const [savedRoster, setSavedRoster] = useState([
    { id: 1, name: 'Alex M.', role: 'Server' },
    { id: 2, name: 'Jordan K.', role: 'Bartender' },
    { id: 3, name: 'Sam T.', role: 'Busser' },
  ]);

  const [roleWeightsConfig, setRoleWeightsConfig] = useState<Record<string, string>>({
    Server: '100',
    Bartender: '100',
    Busser: '50',
    Host: '30',
    Barback: '60',
    Manager: '0',
  });

  const [savedShifts, setSavedShifts] = useState<any[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [calculationResult, setCalculationResult] = useState<any>(null);

  const receiptRef = useRef<HTMLDivElement>(null);

  const currencies = [
    { code: 'USD', symbol: '$' },
    { code: 'GBP', symbol: '£' },
    { code: 'EUR', symbol: '€' },
    { code: 'CAD', symbol: 'CA$' },
    { code: 'AUD', symbol: 'A$' },
  ];

  const splitMethods = ['Role × Hours', 'Hours Only', 'Role Only', 'Equal Split'];
  const allRoles = ['Server', 'Bartender', 'Busser', 'Host', 'Barback', 'Manager'];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Flutterwave Config
  const amountToCharge = selectedPlan === 'annual' ? 39.00 : 4.99; 
  const publicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || '';

  const userEmail = session?.user?.email || 'calebchidi455@gmail.com';
  const userName = session?.user?.name || 'Augustine Caleb';

  const flutterwaveConfig = {
    public_key: publicKey,
    tx_ref: `tipout_${Date.now()}`,
    amount: amountToCharge,
    currency: 'USD', 
    payment_options: 'card',
    redirect_url: `${typeof window !== 'undefined' ? window.location.origin : 'https://tipout-web.vercel.app'}/?payment=success`,
    customer: {
      email: userEmail,
      name: userName,
      phone_number: '',
    },
    customizations: {
      title: 'TipOut Pro',
      description: selectedPlan === 'annual' ? 'Annual Unlimited Pass' : 'Monthly Unlimited Pass',
      logo: 'https://tipout-web.vercel.app/favicon.ico',
    },
  };

  const handleFlutterwavePayment = useFlutterwave(flutterwaveConfig);

  const triggerCheckout = () => {
    setShowSoftCloudModal(true);
    handleFlutterwavePayment({
      callback: async (response) => {
        console.log(response);
        if (response.status === 'successful') {
          try {
            // Instantly ping your newly created upgrade route for immediate UI/DB sync
            await fetch('/api/user/upgrade', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: userEmail, txRef: response.tx_ref }),
            });
          } catch (err) {
            console.error('Failed instant upgrade sync:', err);
          }
        }
        setShowSoftCloudModal(false);
        await update(); // Refreshes session token from Neon database
        showToast('Payment successful! TipOut Pro unlocked.');
        setCurrentScreen('home');
        closePaymentModal();
      },
      onClose: () => {
        setShowSoftCloudModal(false);
        showToast('Payment modal closed.');
      },
    });
  };

  const handleResetForm = () => {
    setTotalTips('');
    setErrorMessage('');
    setStaffList(savedRoster.map(s => ({ ...s, hours: '6' })));
  };

  const handleCalculate = () => {
    const totalTipPool = parseFloat(totalTips) || 0;
    
    if (totalTipPool <= 0) {
      setErrorMessage('Please enter a valid total shift tip amount.');
      return;
    }
    if (staffList.length === 0) {
      setErrorMessage('Please add at least one staff member to split tips.');
      return;
    }

    setErrorMessage('');

    let rawWeights = staffList.map(staff => {
      const hours = parseFloat(staff.hours) || 0;
      const weightPercent = parseFloat(roleWeightsConfig[staff.role]) || 100;
      const weight = weightPercent / 100;

      if (splitMethod === 'Role × Hours') return hours * weight;
      if (splitMethod === 'Hours Only') return hours;
      if (splitMethod === 'Role Only') return weight;
      return 1;
    });

    const totalWeight = rawWeights.reduce((a, b) => a + b, 0);

    const breakdown = staffList.map((staff, idx) => {
      const shareRatio = totalWeight > 0 ? rawWeights[idx] / totalWeight : 1 / staffList.length;
      const rawShare = totalTipPool * shareRatio;
      const hours = parseFloat(staff.hours) || 0;
      const percentage = (shareRatio * 100).toFixed(1);

      return {
        ...staff,
        hours,
        percentage,
        rawShare,
        amount: rawShare,
      };
    });

    let roundedSum = breakdown.reduce((acc, curr) => acc + Math.round(curr.amount * 100), 0);
    let diff = Math.round(totalTipPool * 100) - roundedSum;

    breakdown.sort((a, b) => b.rawShare - a.rawShare);
    for (let i = 0; i < Math.abs(diff); i++) {
      const index = i % breakdown.length;
      breakdown[index].amount += diff > 0 ? 0.01 : -0.01;
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    setCalculationResult({
      totalTipPool,
      staffCount: staffList.length,
      breakdown,
      date: formattedDate
    });

    setIsSaved(false);
    setCurrentScreen('breakdown');
  };

  const handleSaveShift = () => {
    if (isSaved || !calculationResult) return;
    
    if (savedShifts.length >= 6 && !isPro) {
      setCurrentScreen('pro');
      return;
    }

    const newShift = {
      id: Date.now(),
      date: calculationResult.date,
      type: `${splitMethod.toUpperCase()} • ${calculationResult.staffCount} STAFF`,
      amount: `${currencySymbol}${calculationResult.totalTipPool.toFixed(2)}`,
      calculationResult
    };
    setSavedShifts([newShift, ...savedShifts]);
    setIsSaved(true);
    showToast('Shift saved successfully!');
  };

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) return;
    try {
      const dataUrl = await toPng(receiptRef.current, { cacheBust: true, backgroundColor: '#1D2128' });
      const link = document.createElement('a');
      link.download = `tipout-receipt-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      showToast('Receipt downloaded successfully!');
    } catch (err) {
      console.error('Failed to generate receipt image', err);
    }
  };

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#14171C] text-[#F2ECE4]">Loading TipOut...</div>}>
      <PaymentHandler onPaymentSuccess={async () => {
        await update();
        showToast('Payment successful! TipOut Pro unlocked.');
        setCurrentScreen('home');
      }} />

      <div className="flex flex-col min-h-screen p-5 bg-[#14171C] text-[#F2ECE4] font-sans max-w-md mx-auto relative pb-28">
        
        {toastMessage && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#5FA88F] text-[#14171C] font-bold text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* HOME SCREEN */}
        {currentScreen === 'home' && (
          <>
            <div className="flex items-center justify-between mb-8 pt-2">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-[#F2ECE4]">TipOut</h1>
                <p className="text-sm text-[#8B9099] mt-0.5">Split Tips by Hours & Role</p>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => session ? setCurrentScreen('pro') : signIn('google')}
                  className="bg-[#C08552]/20 border border-[#C08552]/40 text-[#C08552] text-xs font-bold px-3 py-2.5 rounded-2xl flex items-center space-x-1 hover:bg-[#C08552]/30 transition"
                >
                  <Zap className="w-3.5 h-3.5 fill-[#C08552]" />
                  <span>{isPro ? 'Pro Active' : session ? session.user?.name?.split(' ')[0] || 'Pro' : 'Sign In'}</span>
                </button>
                <button 
                  onClick={() => setCurrentScreen('roster-weights')}
                  aria-label="Roster & Weights" 
                  className="w-11 h-11 bg-[#1D2128] border border-[#2B303A] rounded-2xl flex items-center justify-center hover:bg-[#2B303A]/50 transition"
                >
                  <SlidersHorizontal className="w-5 h-5 text-[#F2ECE4]" />
                </button>
              </div>
            </div>

            <div onClick={() => { handleResetForm(); setCurrentScreen('new-split'); }} className="bg-[#C08552] rounded-3xl p-6 text-[#14171C] flex items-center justify-between shadow-xl cursor-pointer hover:opacity-95 transition mb-8">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 block mb-1">Start Closing Shift</span>
                <h2 className="text-2xl font-black tracking-tight text-[#14171C]">New Tip Split</h2>
              </div>
              <div className="w-12 h-12 bg-[#F2ECE4] text-[#14171C] rounded-full flex items-center justify-center shadow-md shrink-0">
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8B9099]">Recent Shifts</h3>
              <span className="text-xs font-semibold text-[#C08552] cursor-pointer">View All ({savedShifts.length}/6)</span>
            </div>

            {savedShifts.length === 0 ? (
              <div className="bg-[#1D2128] border border-[#2B303A] rounded-3xl p-8 text-center flex flex-col items-center justify-center space-y-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#2B303A]/60 flex items-center justify-center text-[#8B9099]">
                  <Clock className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-[#F2ECE4]">No shifts recorded yet.</p>
                <p className="text-xs text-[#8B9099] max-w-[240px]">Run your first tip split above to log closing data.</p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {savedShifts.map((shift) => (
                  <div 
                    key={shift.id} 
                    onClick={() => { setCalculationResult(shift.calculationResult); setCurrentScreen('breakdown'); }}
                    className="bg-[#1D2128] border border-[#2B303A] rounded-3xl p-5 flex items-center justify-between shadow-md cursor-pointer hover:border-[#C08552] transition"
                  >
                    <div>
                      <span className="text-xs font-semibold text-[#8B9099]">{shift.date}</span>
                      <div className="text-[11px] font-bold font-mono tracking-wider text-[#8B9099] mt-1">{shift.type}</div>
                    </div>
                    <div className="text-xl font-bold font-mono text-[#5FA88F]">{shift.amount}</div>
                  </div>
                ))}
              </div>
            )}

            {!isPro ? (
              <div 
                onClick={() => setCurrentScreen('pro')}
                className="mt-auto border border-[#C08552]/60 rounded-3xl p-5 flex items-start space-x-4 bg-[#1D2128]/50 cursor-pointer hover:bg-[#1D2128] transition"
              >
                <div className="p-2.5 bg-[#C08552]/10 rounded-2xl text-[#C08552] shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#F2ECE4]">Upgrade to TipOut Pro</h4>
                  <p className="text-xs text-[#8B9099] mt-0.5">Unlock permanent history & unlimited roster size.</p>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => setCurrentScreen('pro')}
                className="mt-auto border border-[#5FA88F]/60 rounded-3xl p-5 flex items-center space-x-4 bg-[#1D2128]/50 cursor-pointer hover:bg-[#1D2128] transition"
              >
                <div className="p-2.5 bg-[#5FA88F]/20 rounded-2xl text-[#5FA88F] shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#F2ECE4]">TipOut Pro Active</h4>
                  <p className="text-xs text-[#8B9099] mt-0.5">All shift limits and history caps are unlocked.</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* ROSTER & WEIGHTS SCREEN */}
        {currentScreen === 'roster-weights' && (
          <div className="flex flex-col min-h-screen pb-16">
            <div className="flex items-center space-x-4 mb-6 pt-2">
              <button onClick={() => setCurrentScreen('home')} className="w-10 h-10 bg-[#1D2128] border border-[#2B303A] rounded-2xl flex items-center justify-center hover:bg-[#2B303A]/50 transition">
                <ArrowLeft className="w-5 h-5 text-[#F2ECE4]" />
              </button>
              <h1 className="text-xl font-bold tracking-tight text-[#F2ECE4]">Roster & Weights</h1>
            </div>

            <div className="mb-6">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#8B9099] block mb-3">Saved Staff Roster</label>
              <div className="space-y-3 mb-3">
                {savedRoster.map((member, idx) => (
                  <div key={member.id} className="bg-[#1D2128] border border-[#2B303A] rounded-3xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#2B303A]/60 pb-2.5">
                      <input
                        type="text"
                        value={member.name}
                        placeholder="Staff name..."
                        onChange={(e) => {
                          const updated = [...savedRoster];
                          updated[idx].name = e.target.value;
                          setSavedRoster(updated);
                        }}
                        className="w-48 bg-[#14171C]/50 border border-[#2B303A]/80 rounded-xl px-3 py-2 text-sm font-bold text-[#F2ECE4] placeholder-[#8B9099]/40 focus:outline-none focus:border-[#C08552] transition"
                      />
                      <button 
                        onClick={() => setSavedRoster(savedRoster.filter(s => s.id !== member.id))}
                        className="text-[#8B9099] hover:text-red-400 transition ml-2 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex space-x-1 overflow-x-auto pb-0.5 scrollbar-none">
                      {allRoles.map((r) => (
                        <button
                          key={r}
                          onClick={() => {
                            const updated = [...savedRoster];
                            updated[idx].role = r;
                            setSavedRoster(updated);
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition shrink-0 ${
                            member.role === r
                              ? 'bg-[#F2ECE4] text-[#14171C] font-bold'
                              : 'bg-[#14171C] border border-[#2B303A] text-[#8B9099]'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={() => {
                  if (savedRoster.length >= 6 && !isPro) {
                    setCurrentScreen('pro');
                    return;
                  }
                  setSavedRoster([...savedRoster, { id: Date.now(), name: `Staff ${savedRoster.length + 1}`, role: 'Server' }]);
                }}
                className="w-full bg-[#1D2128] border border-[#2B303A] hover:border-[#C08552] text-[#F2ECE4] font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center space-x-2 transition"
              >
                <Plus className="w-4 h-4 text-[#C08552]" />
                <span>Add staff member</span>
              </button>
            </div>

            <div className="mb-8">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#8B9099] block mb-3">Role Weights (%)</label>
              <div className="space-y-3">
                {allRoles.map((role) => (
                  <div key={role} className="bg-[#1D2128] border border-[#2B303A] rounded-2xl p-3.5 flex items-center justify-between">
                    <span className="text-sm font-bold text-[#F2ECE4]">{role}</span>
                    <div className="flex items-center space-x-2 bg-[#14171C] border border-[#2B303A] px-3 py-1.5 rounded-xl">
                      <input
                        type="text"
                        value={roleWeightsConfig[role]}
                        onChange={(e) => setRoleWeightsConfig({ ...roleWeightsConfig, [role]: e.target.value })}
                        className="w-10 text-center bg-transparent font-mono text-xs font-bold text-[#F2ECE4] focus:outline-none"
                      />
                      <span className="text-xs text-[#8B9099] font-mono">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div 
              onClick={() => setCurrentScreen('pro')}
              className="border border-[#C08552]/60 rounded-3xl p-4 flex items-start space-x-3.5 bg-[#1D2128]/50 mb-6 cursor-pointer hover:bg-[#1D2128] transition"
            >
              <div className="p-2 bg-[#C08552]/10 rounded-2xl text-[#C08552] shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#F2ECE4]">TipOut Pro Active Limits</h4>
                <p className="text-[11px] text-[#8B9099] mt-0.5">{isPro ? 'All limits currently removed.' : 'Free tier limited to 6 roster items.'}</p>
              </div>
            </div>

            <button 
              onClick={() => {
                setStaffList(savedRoster.map(s => ({ ...s, hours: '6' })));
                setCurrentScreen('home');
                showToast('Roster saved successfully!');
              }}
              className="w-full bg-[#C08552] text-[#14171C] font-bold py-4 rounded-2xl text-xs tracking-wide hover:opacity-95 transition shadow-lg"
            >
              Save Roster & Weights
            </button>
          </div>
        )}

        {/* NEW PRO SCREEN */}
        {currentScreen === 'pro' && (
          <div className="flex flex-col min-h-screen bg-[#14171C]">
            <div className="flex items-center space-x-4 mb-10 pt-2">
              <button onClick={() => setCurrentScreen('home')} className="w-10 h-10 bg-[#1D2128] border border-[#2B303A] rounded-2xl flex items-center justify-center hover:bg-[#2B303A]/50 transition">
                <ArrowLeft className="w-5 h-5 text-[#F2ECE4]" />
              </button>
              <h1 className="text-xl font-bold tracking-tight text-[#F2ECE4]">TipOut Pro</h1>
            </div>

            <div className="flex flex-col items-center text-center px-2 mb-10">
              <span className="bg-[#5FA88F]/15 text-[#5FA88F] text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1.5 rounded-lg mb-6">
                TipOut Pro
              </span>
              <h2 className="text-3xl font-bold text-[#F2ECE4] leading-tight mb-4">
                {isPro ? 'Pro Subscription Active' : 'Unlock Unlimited Shifts'}
              </h2>
              <p className="text-[#8B9099] text-sm leading-relaxed max-w-[280px]">
                {isPro 
                  ? 'Your account has full access to unlimited history, roster sizes, and advanced custom role weights.' 
                  : 'You have reached your free shift limit. Upgrade to Pro to unlock unlimited splits, custom role weights, and advanced reporting.'}
              </p>
            </div>

            {!isPro && (
              <div className="space-y-4 px-2">
                {/* Annual Plan Card */}
                <div 
                  onClick={() => setSelectedPlan('annual')}
                  className={`relative bg-[#1D2128] rounded-3xl p-5 cursor-pointer transition border-[1.5px] ${
                    selectedPlan === 'annual' ? 'border-[#C08552] shadow-[0_0_20px_rgba(192,133,82,0.1)]' : 'border-[#2B303A]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-[#F2ECE4]">Annual Pass</h3>
                    <span className="bg-[#C08552]/20 text-[#C08552] text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-md">
                      Save 35%
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-1.5 mb-2">
                    <span className="text-3xl font-mono font-bold text-[#5FA88F]">$39.00</span>
                    <span className="text-[#8B9099] text-xs">/ year</span>
                  </div>
                  <p className="text-xs text-[#8B9099]">Just $3.25 / month, billed annually.</p>
                </div>

                {/* Monthly Plan Card */}
                <div 
                  onClick={() => setSelectedPlan('monthly')}
                  className={`relative bg-[#1D2128] rounded-3xl p-5 cursor-pointer transition border-[1.5px] ${
                    selectedPlan === 'monthly' ? 'border-[#C08552] shadow-[0_0_20px_rgba(192,133,82,0.1)]' : 'border-[#2B303A]'
                  }`}
                >
                  <div className="mb-1">
                    <h3 className="text-sm font-bold text-[#F2ECE4]">Monthly Pass</h3>
                  </div>
                  <div className="flex items-baseline space-x-1.5 mb-2">
                    <span className="text-3xl font-mono font-bold text-[#5FA88F]">$4.99</span>
                    <span className="text-[#8B9099] text-xs">/ month</span>
                  </div>
                  <p className="text-xs text-[#8B9099]">Billed monthly. Cancel anytime.</p>
                </div>
              </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 p-5 bg-[#14171C]/95 backdrop-blur-md border-t border-[#2B303A] flex justify-center z-50">
              <div className="w-full max-w-md">
                {!isPro ? (
                  <button 
                    onClick={triggerCheckout}
                    className="w-full bg-[#C08552] text-[#14171C] font-bold py-4 rounded-2xl shadow-lg hover:opacity-95 transition tracking-wide text-sm flex items-center justify-center cursor-pointer"
                  >
                    Continue to Payment (${selectedPlan === 'annual' ? '39.00' : '4.99'})
                  </button>
                ) : (
                  <button 
                    onClick={() => setCurrentScreen('home')}
                    className="w-full bg-[#5FA88F] text-[#14171C] font-bold py-4 rounded-2xl shadow-lg hover:opacity-95 transition tracking-wide text-sm flex items-center justify-center cursor-pointer"
                  >
                    Back to Dashboard
                  </button>
                )}
              </div>
            </div>

            {/* Soft Cloud Psychology Modal */}
            {showSoftCloudModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all duration-300">
                <div 
                  className="w-full max-w-md p-8 rounded-3xl shadow-2xl text-center border border-white/40 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                  style={{
                    background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
                    boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                  }}
                >
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-100 rounded-full blur-2xl opacity-60 pointer-events-none"></div>
                  <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-100 rounded-full blur-2xl opacity-60 pointer-events-none"></div>

                  <div className="relative z-10">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white/80 shadow-sm flex items-center justify-center text-xl">
                      🤍
                    </div>
                    
                    <h3 className="text-lg font-semibold text-slate-800 tracking-tight mb-2">
                      Thanks for choosing TipOut
                    </h3>
                    
                    <p className="text-sm text-slate-600 leading-relaxed font-normal mb-6">
                      Your subscription is being processed securely — see you back in the app!
                    </p>

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-slate-200/60 text-xs text-slate-500 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Encrypted & Secure Gateway
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BREAKDOWN SCREEN */}
        {currentScreen === 'breakdown' && calculationResult && (
          <div className="flex flex-col min-h-screen pb-28">
            <div className="flex items-center space-x-4 mb-6 pt-2">
              <button onClick={() => setCurrentScreen('home')} className="w-10 h-10 bg-[#1D2128] border border-[#2B303A] rounded-2xl flex items-center justify-center hover:bg-[#2B303A]/50 transition">
                <ArrowLeft className="w-5 h-5 text-[#F2ECE4]" />
              </button>
              <h1 className="text-xl font-bold tracking-tight text-[#F2ECE4]">Shift Breakdown</h1>
            </div>

            <div ref={receiptRef} className="bg-[#1D2128] border border-[#2B303A] rounded-3xl p-6 space-y-4 shadow-xl mb-4">
              <div className="text-center pb-3 border-b border-[#2B303A]">
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#F2ECE4]">CLOSING TICKET SUMMARY</h2>
                <p className="text-xs font-mono text-[#8B9099] mt-1">{calculationResult.date}</p>
              </div>

              <div className="space-y-2 pb-3 border-b border-[#2B303A] text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8B9099] uppercase font-semibold">TOTAL TIP POOL</span>
                  <span className="font-mono font-bold text-[#F2ECE4]">{currencySymbol}{calculationResult.totalTipPool.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8B9099] uppercase font-semibold">STAFF COUNT</span>
                  <span className="font-mono font-bold text-[#F2ECE4]">{calculationResult.staffCount}</span>
                </div>
              </div>

              <div className="space-y-3.5 pb-3 border-b border-[#2B303A]">
                {calculationResult.breakdown.map((staff: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-[#F2ECE4]">{staff.name}</div>
                      <div className="text-xs font-mono text-[#8B9099] mt-0.5">{staff.role} • {staff.hours}h ({staff.percentage}%)</div>
                    </div>
                    <div className="text-base font-mono font-bold text-[#5FA88F]">{currencySymbol}{staff.amount.toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#F2ECE4]">EXACT MATCH TOTAL</span>
                <span className="text-lg font-mono font-extrabold text-[#5FA88F]">{currencySymbol}{calculationResult.totalTipPool.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={handleDownloadReceipt}
              className="w-full border border-[#C08552] rounded-2xl py-3.5 px-4 flex items-center justify-center space-x-2 text-[#C08552] text-xs font-bold hover:bg-[#C08552]/10 transition mb-6"
            >
              <Download className="w-4 h-4" />
              <span>Download / Share Receipt Image</span>
            </button>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#14171C]/95 backdrop-blur-md border-t border-[#2B303A] flex justify-center z-50">
              <div className="w-full max-w-md grid grid-cols-2 gap-3">
                <button 
                  onClick={handleSaveShift}
                  className={`py-3.5 rounded-2xl font-bold text-xs tracking-wide transition flex items-center justify-center space-x-1.5 ${
                    isSaved ? 'bg-[#5FA88F] text-[#14171C]' : 'bg-[#C08552] text-[#14171C] hover:opacity-95'
                  }`}
                >
                  {isSaved ? <Check className="w-4 h-4" /> : null}
                  <span>{isSaved ? 'Shift Saved' : 'Save shift'}</span>
                </button>
                <button 
                  onClick={() => { handleResetForm(); setCurrentScreen('home'); }}
                  className="bg-[#1D2128] border border-[#2B303A] text-[#F2ECE4] py-3.5 rounded-2xl font-bold text-xs tracking-wide hover:bg-[#2B303A]/50 transition"
                >
                  Done / Home
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NEW SPLIT SCREEN */}
        {currentScreen === 'new-split' && (
          <div className="flex flex-col min-h-screen pb-32">
            <div className="flex items-center space-x-4 mb-6 pt-2">
              <button onClick={() => setCurrentScreen('home')} className="w-10 h-10 bg-[#1D2128] border border-[#2B303A] rounded-2xl flex items-center justify-center hover:bg-[#2B303A]/50 transition">
                <ArrowLeft className="w-5 h-5 text-[#F2ECE4]" />
              </button>
              <h1 className="text-xl font-bold tracking-tight text-[#F2ECE4]">New Shift Split</h1>
            </div>

            <div className="mb-6">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#8B9099] block mb-2.5">Currency</label>
              <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
                {currencies.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => { setCurrency(c.code); setCurrencySymbol(c.symbol); }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition shrink-0 ${
                      currency === c.code 
                        ? 'bg-[#C08552] text-[#14171C]' 
                        : 'bg-[#1D2128] border border-[#2B303A] text-[#8B9099] hover:text-[#F2ECE4]'
                    }`}
                  >
                    {c.symbol} {c.code}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#8B9099] block mb-2.5">Total Shift Tips</label>
              <div className="bg-[#1D2128] border border-[#2B303A] rounded-3xl p-5 flex items-center space-x-3">
                <span className="text-2xl font-mono text-[#5FA88F] font-bold">{currencySymbol}</span>
                <input
                  type="text"
                  value={totalTips}
                  onChange={(e) => { setTotalTips(e.target.value); if (errorMessage) setErrorMessage(''); }}
                  className="w-full bg-transparent text-3xl font-mono font-bold text-[#F2ECE4] placeholder-[#8B9099]/40 focus:outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#8B9099] block mb-2.5">Split Method</label>
              <div className="grid grid-cols-2 gap-2.5">
                {splitMethods.map((method) => (
                  <button
                    key={method}
                    onClick={() => setSplitMethod(method)}
                    className={`py-3 px-4 rounded-2xl text-xs font-semibold text-center transition border ${
                      splitMethod === method
                        ? 'bg-[#C08552] border-[#C08552] text-[#14171C] font-bold'
                        : 'bg-[#1D2128] border-[#2B303A] text-[#8B9099] hover:text-[#F2ECE4]'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#8B9099]">Staff on Shift ({staffList.length})</label>
              <button 
                onClick={() => { 
                  if (staffList.length >= 6 && !isPro) {
                    setCurrentScreen('pro');
                    return;
                  }
                  setStaffList([...staffList, { id: Date.now(), name: `Staff ${staffList.length + 1}`, role: 'Server', hours: '6' }]); 
                  if (errorMessage) setErrorMessage(''); 
                }}
                className="text-xs font-bold text-[#C08552] hover:underline flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Staff Member</span>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {staffList.map((staff, idx) => (
                <div key={staff.id} className="bg-[#1D2128] border border-[#2B303A] rounded-3xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#2B303A]/60 pb-2.5">
                    <input
                      type="text"
                      value={staff.name}
                      placeholder="Staff name..."
                      onChange={(e) => {
                        const updated = [...staffList];
                        updated[idx].name = e.target.value;
                        setStaffList(updated);
                      }}
                      className="w-56 bg-[#14171C]/50 border border-[#2B303A]/80 rounded-xl px-3 py-2 text-sm font-bold text-[#F2ECE4] placeholder-[#8B9099]/40 focus:outline-none focus:border-[#C08552] transition"
                    />
                    <button 
                      onClick={() => setStaffList(staffList.filter(s => s.id !== staff.id))}
                      className="text-[#8B9099] hover:text-red-400 transition ml-3 shrink-0 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex space-x-1 overflow-x-auto pb-0.5 scrollbar-none">
                      {allRoles.map((r) => (
                        <button
                          key={r}
                          onClick={() => {
                            const updated = [...staffList];
                            updated[idx].role = r;
                            setStaffList(updated);
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition shrink-0 ${
                            staff.role === r
                              ? 'bg-[#F2ECE4] text-[#14171C] font-bold'
                              : 'bg-[#14171C] border border-[#2B303A] text-[#8B9099]'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center space-x-1 bg-[#14171C] border border-[#2B303A] px-2.5 py-1.5 rounded-xl shrink-0">
                      <input
                        type="text"
                        value={staff.hours}
                        onChange={(e) => {
                          const updated = [...staffList];
                          updated[idx].hours = e.target.value;
                          setStaffList(updated);
                        }}
                        className="w-5 text-center bg-transparent font-mono text-xs font-bold text-[#F2ECE4] focus:outline-none"
                      />
                      <span className="text-[11px] text-[#8B9099] font-mono">hrs</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {errorMessage && (
              <div className="mb-4 bg-red-950/40 border border-red-900/60 rounded-2xl p-3.5 flex items-center space-x-3 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#14171C]/95 backdrop-blur-md border-t border-[#2B303A] flex justify-center z-50">
              <div className="w-full max-w-md">
                <button 
                  onClick={handleCalculate}
                  className="w-full bg-[#C08552] text-[#14171C] font-bold py-4 rounded-2xl shadow-lg hover:opacity-95 transition tracking-wide text-sm"
                >
                  Split tips
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Suspense>
  );
}