import { motion } from 'framer-motion';
import { User, Bell, Mic, Volume2, Globe, Trash2, LogOut } from 'lucide-react';
import { cn } from '../utils/cn';

interface SettingsViewProps {
  className?: string;
}

export function SettingsView({ className }: SettingsViewProps) {
  return (
    <div className={cn('space-y-6 max-w-2xl', className)}>
      {/* Profile section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-cream-400 mb-6">Profile</h3>
        <div className="flex items-center gap-6 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center">
            <User className="w-10 h-10 text-cream-400" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-cream-400">John Doe</h4>
            <p className="text-sm text-highlight-500">john.doe@email.com</p>
            <span className="inline-block mt-2 px-3 py-1 rounded-full bg-highlight-500/20 text-cream-400 text-xs font-medium">
              Premium Plan
            </span>
          </div>
        </div>
      </motion.div>

      {/* Voice settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-cream-400 mb-6">Voice Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-theme-700">
            <div className="flex items-center gap-3">
              <Mic className="w-5 h-5 text-cream-400/60" />
              <div>
                <p className="font-medium text-cream-400">Voice Input</p>
                <p className="text-xs text-highlight-500">Enable microphone access</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-highlight-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-cream-400 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-cream-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-highlight-500" />
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-theme-700">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-cream-400/60" />
              <div>
                <p className="font-medium text-cream-400">AI Voice Response</p>
                <p className="text-xs text-highlight-500">Hear AI responses aloud</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-highlight-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-cream-400 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-cream-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-highlight-500" />
            </label>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-cream-400/60" />
              <div>
                <p className="font-medium text-cream-400">Language</p>
                <p className="text-xs text-highlight-500">Voice recognition language</p>
              </div>
            </div>
            <select className="bg-theme-700 border border-highlight-500 rounded-lg px-3 py-2 text-sm text-cream-400 focus:outline-none focus:border-highlight-500">
              <option>English (US)</option>
              <option>English (UK)</option>
              <option>Spanish</option>
              <option>French</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-cream-400 mb-6">Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-theme-700">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-cream-400/60" />
              <div>
                <p className="font-medium text-cream-400">Budget Alerts</p>
                <p className="text-xs text-highlight-500">When approaching budget limits</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-highlight-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-cream-400 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-cream-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-highlight-500" />
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-theme-700">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-cream-400/60" />
              <div>
                <p className="font-medium text-cream-400">Bill Reminders</p>
                <p className="text-xs text-highlight-500">Upcoming subscription payments</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-highlight-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-cream-400 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-cream-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-highlight-500" />
            </label>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-cream-400/60" />
              <div>
                <p className="font-medium text-cream-400">Weekly Summary</p>
                <p className="text-xs text-highlight-500">Weekly financial recap</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-highlight-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-cream-400 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-cream-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-highlight-500" />
            </label>
          </div>
        </div>
      </motion.div>

      {/* Danger zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card border-highlight-500/50"
      >
        <h3 className="text-lg font-semibold text-highlight-500 mb-6">Danger Zone</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-theme-700">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-highlight-500" />
              <div>
                <p className="font-medium text-cream-400">Clear All Data</p>
                <p className="text-xs text-highlight-500">Delete all transactions and settings</p>
              </div>
            </div>
            <button className="px-4 py-2 rounded-lg bg-highlight-500/20 text-highlight-500 text-sm font-medium hover:bg-highlight-500/30 transition-colors">
              Clear Data
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-highlight-500" />
              <div>
                <p className="font-medium text-cream-400">Sign Out</p>
                <p className="text-xs text-highlight-500">Log out of your account</p>
              </div>
            </div>
            <button className="px-4 py-2 rounded-lg bg-highlight-500/20 text-highlight-500 text-sm font-medium hover:bg-highlight-500/30 transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
