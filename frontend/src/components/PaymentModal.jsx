import React, { useState } from 'react';
import { X, Lock, CheckCircle2, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';
import api from '../utils/api';

export default function PaymentModal({ amount, jobTitle, jobId, providerId, userName, userEmail, onVerified, onClose }) {
  const [step, setStep]     = useState('confirm'); // confirm | processing | success | failed
  const [errMsg, setErrMsg] = useState('');
  const [tx, setTx]         = useState(null);

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload  = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePay = async () => {
    setStep('processing');
    setErrMsg('');

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Failed to load Razorpay. Check your internet connection.');

      // 1. Create order on backend
      const { data: order } = await api.post('/payments/create-order', { amount });

      // 2. Open Razorpay checkout popup
      await new Promise((resolve, reject) => {
        const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
        if (!razorpayKey) throw new Error('Payment configuration missing. Please contact support.');

        const options = {
          key:         razorpayKey,
          amount:      order.amount,
          currency:    order.currency,
          name:        'WorkBridge',
          description: jobTitle,
          image:       'https://workbridge-frontend-jet.vercel.app/favicon.ico',
          order_id:    order.orderId,
          prefill: {
            name:    userName  || '',
            email:   userEmail || '',
            contact: '',
          },
          notes: { jobId, providerId },
          theme: { color: '#7c3aed', hide_topbar: false },
          config: {
            display: {
              preferences: { show_default_blocks: true },
            },
          },
          retry: { enabled: true, max_count: 3 },
          timeout: 900,
          handler: async (response) => {
            try {
              const { data: result } = await api.post('/payments/verify', {
                razorpayOrderId:   response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                jobId,
                providerId,
                amount,
              });
              setTx(result.transaction);
              setStep('success');
              onVerified?.(result.transaction);
              resolve();
            } catch (err) {
              reject(new Error(err.response?.data?.message || 'Payment verification failed'));
            }
          },
          modal: {
            ondismiss: () => reject(new Error('Payment cancelled by user')),
            escape: true,
            animation: true,
            backdropclose: false,
            handleback: true,
            confirm_close: true,
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (resp) => {
          reject(new Error(resp.error?.description || 'Payment failed'));
        });
        rzp.open();
      });

    } catch (err) {
      setErrMsg(err.message || 'Payment failed');
      setStep('failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
           onClick={step === 'confirm' ? onClose : undefined} />

      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up">

        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm">WorkBridge Pay</p>
              <p className="text-violet-200 text-xs flex items-center gap-1">
                <ShieldCheck size={9} /> Powered by Razorpay
              </p>
            </div>
          </div>
          {(step === 'confirm' || step === 'failed') && (
            <button onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
              <X size={14} className="text-white" />
            </button>
          )}
        </div>

        {/* Amount strip */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Paying for</p>
            <p className="text-sm font-semibold text-slate-800 truncate max-w-[200px]">{jobTitle}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Amount</p>
            <p className="text-2xl font-bold text-slate-900">₹{amount}</p>
          </div>
        </div>

        {/* ── CONFIRM ── */}
        {step === 'confirm' && (
          <div className="px-6 py-6 space-y-4">
            {/* Breakdown */}
            <div className="bg-slate-50 rounded-2xl px-4 py-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Job amount</span><span className="font-semibold">₹{amount}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Platform fee (10%)</span><span>₹{(amount * 0.10).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500 border-t border-slate-200 pt-1.5">
                <span>Provider receives</span>
                <span className="font-semibold text-emerald-600">₹{(amount * 0.90).toFixed(2)}</span>
              </div>
            </div>

            <button onClick={handlePay}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg active:scale-[0.98]">
              <Lock size={14} /> Pay ₹{amount} via Razorpay
            </button>

            <p className="text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Lock size={8} /> 256-bit SSL · PCI DSS compliant
            </p>
          </div>
        )}

        {/* ── PROCESSING ── */}
        {step === 'processing' && (
          <div className="px-6 py-14 flex flex-col items-center gap-4">
            <Loader2 size={40} className="text-violet-500 animate-spin" />
            <div className="text-center">
              <p className="font-bold text-slate-800 text-lg">Opening Payment…</p>
              <p className="text-slate-400 text-sm mt-1">Please don't close this window</p>
            </div>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {step === 'success' && (
          <div className="px-6 py-10 flex flex-col items-center gap-5 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-xl">Payment Successful!</p>
              <p className="text-slate-500 text-sm mt-1">Transaction saved to your account</p>
            </div>
            {tx && (
              <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2.5 text-sm text-left">
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment ID</span>
                  <span className="font-mono text-xs text-slate-700 truncate ml-2 max-w-[180px]">{tx.razorpayPaymentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount paid</span>
                  <span className="font-semibold text-slate-800">₹{tx.totalAmount}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Platform fee (10%)</span>
                  <span>₹{tx.commissionAmount}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-slate-200 pt-2">
                  <span className="text-slate-500">Provider earns</span>
                  <span className="font-semibold text-emerald-600">₹{tx.providerEarning}</span>
                </div>
              </div>
            )}
            <button onClick={onClose}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm hover:from-violet-700 hover:to-indigo-700 transition-all">
              Done
            </button>
          </div>
        )}

        {/* ── FAILED ── */}
        {step === 'failed' && (
          <div className="px-6 py-10 flex flex-col items-center gap-5 text-center">
            <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center">
              <AlertCircle size={40} className="text-rose-500" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-xl">Payment Failed</p>
              {errMsg && (
                <p className="text-xs mt-2 bg-rose-50 border border-rose-100 text-rose-500 rounded-xl px-3 py-2 font-mono text-left">
                  {errMsg}
                </p>
              )}
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={() => { setStep('confirm'); setErrMsg(''); }}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm hover:from-violet-700 hover:to-indigo-700 transition-all">
                Try Again
              </button>
              <button onClick={onClose}
                className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
