import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Mail, ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';
import { UserMessage } from '../types.ts';

export default function MessageForm() {
  const [step, setStep] = useState<'message' | 'details' | 'success'>('message');
  const [messageText, setMessageText] = useState('');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const handleMessageSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) {
      setErrorStatus('Please leave a short message before sending.');
      return;
    }
    setErrorStatus(null);
    setStep('details');
  };

  const handleDetailsSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setErrorStatus('Please enter your first name.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorStatus('Please enter a valid email address.');
      return;
    }

    const newMessage: UserMessage = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      message: messageText,
      firstName: firstName,
      email: email,
      createdAt: new Date().toISOString(),
    };

    // Store in localStorage for the offline persistence expectation
    const existingRaw = localStorage.getItem('norb_messages');
    const existing: UserMessage[] = existingRaw ? JSON.parse(existingRaw) : [];
    localStorage.setItem('norb_messages', JSON.stringify([newMessage, ...existing]));

    setErrorStatus(null);
    setStep('success');
  };

  const handleReset = () => {
    setMessageText('');
    setFirstName('');
    setEmail('');
    setStep('message');
    setErrorStatus(null);
  };

  return (
    <div id="contact-form-container" className="w-full max-w-xl mx-auto">
      <AnimatePresence mode="wait">
        {step === 'message' && (
          <motion.div
            key="message-step"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <form onSubmit={handleMessageSubmit} className="relative w-full">
              <div className="relative flex w-full flex-col md:flex-row items-stretch gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-2 focus-within:border-orange-600 focus-within:ring-1 focus-within:ring-orange-600 transition-all">
                <input
                  id="message-input"
                  type="text"
                  placeholder="Drop a note about an idea, project, or just say hi..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full bg-transparent px-4 py-5 md:py-6 text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm md:text-base selection:bg-orange-600/30"
                />
                <button
                  id="message-send-btn"
                  type="submit"
                  className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition-all shadow-md active:scale-95 shrink-0"
                >
                  <span>Send</span>
                  <Send className="w-4 h-4" />
                </button>
              </div>
              {errorStatus && (
                <p id="msg-err" className="text-orange-500 text-xs mt-2 pl-2">
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

            <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/60">
              <span className="text-[10px] text-zinc-500 font-mono block mb-1">Your draft message:</span>
              <p className="text-zinc-300 text-xs italic line-clamp-2">" {messageText} "</p>
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
                className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-medium text-sm py-2.5 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-orange-600 focus:ring-offset-2 focus:ring-offset-zinc-950 shadow-md active:scale-98"
              >
                <span>Submit message</span>
                <ArrowRight className="w-4 h-4" />
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
