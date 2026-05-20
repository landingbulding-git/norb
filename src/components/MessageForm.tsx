import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Mail, ArrowRight, CheckCircle2, RotateCcw, Loader2 } from 'lucide-react';
import { UserMessage } from '../types.ts';

export default function MessageForm() {
  const [step, setStep] = useState<'message' | 'details' | 'success'>('message');
  const [messageText, setMessageText] = useState('');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMessageSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) {
      setErrorStatus('Please leave a short message before sending.');
      return;
    }
    setErrorStatus(null);
    setStep('details');
  };

  const handleDetailsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setErrorStatus('Please enter your first name.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorStatus('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorStatus(null);

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          access_key: '644870ab-6b5f-4ae8-a3f2-9d883c85b034',
          name: firstName,
          email: email,
          message: messageText,
        })
      });

      const result = await response.json();

      if (result.success) {
        // Keep the local storage mock just in case for UI persistence/history
        const newMessage: UserMessage = {
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
          message: messageText,
          firstName: firstName,
          email: email,
          createdAt: new Date().toISOString(),
        };
        const existingRaw = localStorage.getItem('norb_messages');
        const existing: UserMessage[] = existingRaw ? JSON.parse(existingRaw) : [];
        localStorage.setItem('norb_messages', JSON.stringify([newMessage, ...existing]));

        setStep('success');
      } else {
        setErrorStatus(result.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setErrorStatus('Network error. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setMessageText('');
    setFirstName('');
    setEmail('');
    setStep('message');
    setErrorStatus(null);
  };

  return (
    <div id="contact-form-container" className="w-full">
      <AnimatePresence mode="wait">
        {step === 'message' && (
          <motion.div
          key="message-step"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="space-y-4 w-full"
          >            <form onSubmit={handleMessageSubmit} className="relative w-full group">
              <div className="relative flex w-full flex-col items-center bg-zinc-950 border border-zinc-800/80 rounded-2xl p-1.5 focus-within:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-700/50 transition-all shadow-2xl">
                <textarea
                  id="message-input"
                  rows={1}
                  placeholder="Drop a note about an idea, project, or just say hi..."
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  className="w-full bg-transparent px-4 py-4 text-zinc-100 placeholder-zinc-600 focus:outline-none text-sm md:text-base selection:bg-orange-600/30 resize-none min-h-[56px] max-h-[200px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleMessageSubmit(e);
                    }
                  }}
                />
                <div className="w-full flex justify-between items-center px-2 py-1.5 border-t border-zinc-900/50 mt-1">
                  <div className="flex items-center gap-1.5 px-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Available for work</span>
                  </div>
                  <button
                    id="message-send-btn"
                    type="submit"
                    className="flex items-center gap-2 bg-zinc-100 hover:bg-white active:scale-[0.98] text-zinc-950 px-4 py-2 rounded-xl transition-all font-medium text-xs md:text-sm group/btn shadow-lg"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
              {errorStatus && (
                <p id="msg-err" className="text-orange-500 text-[10px] mt-2 pl-4 font-mono">
                  {errorStatus}
                </p>
              )}
            </form>
          </motion.div>
        )}

        {step === 'details' && (
          <motion.div
            key="details-step"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-zinc-900 border border-zinc-500/20 rounded-xl p-5 md:p-6 space-y-4 shadow-xl"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-orange-500 font-mono font-medium">Step 2 of 2</p>
                <h3 className="text-base md:text-lg font-display text-zinc-100 font-semibold mt-1">
                  Tell me where to reply
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStep('message')}
                className="text-zinc-500 hover:text-zinc-300 text-xs font-mono"
              >
                ← Back
              </button>
            </div>

            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="first-name-input" className="text-xs font-medium text-zinc-400 block pl-1">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      id="first-name-input"
                      type="text"
                      placeholder="Norb"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 pl-9 pr-4 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-orange-600 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="email-input" className="text-xs font-medium text-zinc-400 block pl-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      id="email-input"
                      type="email"
                      placeholder="sayhi@norb.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 pl-9 pr-4 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-orange-600 transition-all"
                    />
                  </div>
                </div>
              </div>

              {errorStatus && (
                <p id="details-err" className="text-orange-500 text-xs pl-1">
                  {errorStatus}
                </p>
              )}

              <button
                id="details-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 disabled:bg-orange-600/50 disabled:cursor-not-allowed text-white font-medium text-sm py-2.5 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-orange-600 focus:ring-offset-2 focus:ring-offset-zinc-950 shadow-md active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Submit message</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success-step"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="bg-zinc-900 border border-orange-500/30 rounded-xl p-6 text-center space-y-4 shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-2 h-full bg-orange-600"></div>
            <div className="flex justify-center">
              <div className="p-3 bg-orange-600/10 rounded-full border border-orange-500/20 text-orange-500">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-display text-zinc-100 font-bold">Successfully cooked!</h3>
              <p className="text-sm text-zinc-400">
                Thanks, <span className="text-orange-500 font-semibold">{firstName}</span>. I'll read this over coffee and get back to you soon.
              </p>
            </div>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-orange-500 font-mono transition-all py-1 px-3 rounded-md hover:bg-zinc-950/40"
            >
              <RotateCcw className="w-3" />
              <span>Send another message</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
