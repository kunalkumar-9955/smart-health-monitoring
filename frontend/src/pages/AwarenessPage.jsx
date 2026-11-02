import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import { useAppStore } from '../store';
import { Droplets, Shield, Sun, BookOpen, Heart, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const tips = [
  {
    category: 'Safe Drinking Water',
    icon: Droplets,
    color: 'from-blue-500 to-cyan-500',
    items: [
      'Always boil water for at least 1 minute before drinking',
      'Use chlorine tablets or water purification filters',
      'Store purified water in covered, clean containers',
      'Never drink water from open sources during monsoon',
      'Check for turbidity — clear water is generally safer',
    ],
  },
  {
    category: 'Personal Hygiene',
    icon: Shield,
    color: 'from-green-500 to-emerald-500',
    items: [
      'Wash hands with soap before eating and after toilet use',
      'Use proper sanitation facilities at all times',
      'Avoid open defecation — use community toilets',
      'Keep fingernails clean and trimmed',
      'Bathe daily with clean water',
    ],
  },
  {
    category: 'Food Safety',
    icon: Heart,
    color: 'from-orange-500 to-amber-500',
    items: [
      'Cook food thoroughly before consumption',
      'Avoid raw vegetables washed with contaminated water',
      'Cover food to prevent fly contamination',
      'Do not eat at unhygienic roadside stalls',
      'Refrigerate cooked food promptly',
    ],
  },
  {
    category: 'Disease Prevention',
    icon: AlertTriangle,
    color: 'from-red-500 to-rose-500',
    items: [
      'Get vaccinated — check with your ASHA worker for schedule',
      'Use mosquito nets and repellents during monsoon',
      'Report any unusual illness to your ASHA worker immediately',
      'Isolate patients with diarrhea/cholera to prevent spread',
      'Dispose of waste properly away from water sources',
    ],
  },
  {
    category: 'Seasonal Precautions',
    icon: Sun,
    color: 'from-purple-500 to-violet-500',
    items: [
      '🌧️ Monsoon: Be extra careful with water sources and food',
      '☀️ Summer: Stay hydrated with safe water to prevent dehydration',
      'Avoid waterlogging near homes — breeds mosquitoes',
      'Clean water tanks monthly during all seasons',
      'Report water contamination to authorities immediately',
    ],
  },
];

const diseases = [
  { name: 'Cholera', spread: 'Contaminated water', symptoms: 'Severe watery diarrhea, vomiting, dehydration', prevention: 'Safe water, ORS treatment, vaccination', color: 'blue', icon: '💧' },
  { name: 'Typhoid', spread: 'Food/water contaminated with feces', symptoms: 'High fever, stomach pain, weakness', prevention: 'Clean water, proper sanitation, vaccination', color: 'yellow', icon: '🌡️' },
  { name: 'Dysentery', spread: 'Contaminated water/food', symptoms: 'Bloody diarrhea, cramps, fever', prevention: 'Hand washing, safe water, food hygiene', color: 'orange', icon: '⚠️' },
  { name: 'Hepatitis A', spread: 'Contaminated water and food', symptoms: 'Jaundice, fever, nausea, fatigue', prevention: 'Vaccination, safe water, proper sanitation', color: 'red', icon: '🔴' },
];

export default function AwarenessPage() {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  return (
    <Layout title="Health Awareness Center" subtitle="Hygiene tips, disease guides, and prevention practices">
      <div className="space-y-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 p-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Community Health Education</h2>
              <p className="text-cyan-400 text-sm mt-1">Knowledge is the first defense against water-borne diseases. Learn how to protect your family.</p>
            </div>
          </div>
        </motion.div>

        {/* Tips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tips.map((section, i) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className={`font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>{section.category}</h3>
                <ul className="space-y-2">
                  {section.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-400">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Disease Guide */}
        <div>
          <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            🦠 Common Water-Borne Diseases
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {diseases.map((disease, i) => (
              <motion.div
                key={disease.name}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className={`rounded-2xl border p-5 ${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{disease.icon}</span>
                  <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{disease.name}</h3>
                </div>
                <div className="space-y-2 text-sm">
                  {[
                    { label: 'Spread via', value: disease.spread, icon: '📡' },
                    { label: 'Symptoms', value: disease.symptoms, icon: '🤒' },
                    { label: 'Prevention', value: disease.prevention, icon: '✅' },
                  ].map(({ label, value, icon }) => (
                    <div key={label}>
                      <span className="text-xs text-slate-500 font-medium">{icon} {label}:</span>
                      <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Emergency Numbers */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5"
        >
          <h3 className={`font-bold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <AlertTriangle className="w-4 h-4 text-red-400" />
            Emergency Contacts
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: 'National Health Helpline', number: '104' },
              { name: 'Medical Emergency', number: '102' },
              { name: 'District Hospital', number: '1800-xxx-xxxx' },
              { name: 'ASHA Worker Hotline', number: '1800-xxx-xxxx' },
            ].map(({ name, number }) => (
              <div key={name} className={`p-3 rounded-xl text-center ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                <div className="text-lg font-bold text-red-400">{number}</div>
                <div className="text-xs text-slate-500 mt-1">{name}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
