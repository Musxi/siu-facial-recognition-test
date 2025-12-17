import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { PersonProfile, RecognitionLog } from '../types';
import { translations, Language } from '../utils/i18n';

interface DataVisualizationProps {
  profiles: PersonProfile[];
  logs: RecognitionLog[];
  lang: Language;
}

const COLORS = {
  male: '#3b82f6', // blue-500
  female: '#ec4899', // pink-500
  unknown: '#ef4444', // red-500
  known: '#10b981', // green-500
  pie: ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444']
};

const DataVisualization: React.FC<DataVisualizationProps> = ({ profiles, logs, lang }) => {
  const t = translations[lang];

  // --- 1. KPI Calculation (Key Performance Indicators) ---
  const totalLogs = logs.length;
  const unknownLogs = logs.filter(l => l.isUnknown).length;
  const unknownRate = totalLogs > 0 ? Math.round((unknownLogs / totalLogs) * 100) : 0;
  
  // Avg Age
  const logsWithAge = logs.filter(l => l.age !== undefined);
  const avgAge = logsWithAge.length > 0 
    ? Math.round(logsWithAge.reduce((acc, l) => acc + (l.age || 0), 0) / logsWithAge.length) 
    : '-';
  
  // Gender Ratio
  const maleCount = logs.filter(l => l.gender === 'male').length;
  const femaleCount = logs.filter(l => l.gender === 'female').length;
  const genderRatio = totalLogs > 0 ? `${Math.round((maleCount/totalLogs)*100)}% / ${Math.round((femaleCount/totalLogs)*100)}%` : '- / -';

  // --- 2. Chart: Hourly Activity (Traffic) ---
  // Initialize 24 hours
  const hours = Array.from({ length: 24 }, (_, i) => ({ 
      hour: `${i}:00`, 
      count: 0 
  }));
  
  logs.forEach(log => {
      const h = new Date(log.timestamp).getHours();
      hours[h].count += 1;
  });
  
  // Filter to only show hours with data or a range if needed. Currently showing all 24h for "Heatmap" feel.
  
  // --- 3. Chart: Demographics (Age Groups) ---
  const ageGroups = [
      { name: '<18', count: 0 },
      { name: '18-30', count: 0 },
      { name: '30-50', count: 0 },
      { name: '50+', count: 0 },
  ];
  
  logsWithAge.forEach(log => {
      const age = log.age!;
      if (age < 18) ageGroups[0].count++;
      else if (age < 30) ageGroups[1].count++;
      else if (age < 50) ageGroups[2].count++;
      else ageGroups[3].count++;
  });

  // --- 4. Chart: Emotions / Sentiment ---
  const emotions: Record<string, number> = {};
  logs.forEach(log => {
      if (log.expression) {
          // Translate expression key if possible, or capitalize
          const label = t.expressions[log.expression as keyof typeof t.expressions] || log.expression;
          emotions[label] = (emotions[label] || 0) + 1;
      }
  });
  const emotionData = Object.keys(emotions).map(k => ({ name: k, value: emotions[k] })).sort((a,b) => b.value - a.value);

  // --- Custom Tooltip ---
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-2 border border-gray-700 rounded shadow-lg text-xs">
          <p className="text-gray-300 font-bold mb-1">{label}</p>
          <p className="text-cyan-400">
             {payload[0].name}: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      
      {/* KPI ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
                  <svg className="w-16 h-16 text-cyan-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>
              </div>
              <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{t.kpiTotal}</h4>
              <div className="text-3xl font-mono font-bold text-white">{totalLogs}</div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
                 <svg className="w-16 h-16 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              </div>
              <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{t.kpiUnknown}</h4>
              <div className={`text-3xl font-mono font-bold ${unknownRate > 50 ? 'text-red-400' : 'text-green-400'}`}>{unknownRate}%</div>
          </div>

          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
                  <svg className="w-16 h-16 text-purple-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 18zM6 12a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H8a2 2 0 01-2-2v-2z" clipRule="evenodd" /></svg>
              </div>
              <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{t.kpiAvgAge}</h4>
              <div className="text-3xl font-mono font-bold text-white">{avgAge} <span className="text-sm font-normal text-gray-500">{t.ageUnit}</span></div>
          </div>

          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
                  <svg className="w-16 h-16 text-pink-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
               </div>
              <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">M / F ({t.kpiGender})</h4>
              <div className="text-3xl font-mono font-bold text-white">{genderRatio}</div>
          </div>
      </div>

      {/* CHARTS ROW 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Activity Heatmap */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex flex-col">
          <h3 className="text-lg font-bold mb-4 text-gray-200">{t.chartActivity}</h3>
          <div className="h-64 flex-1 relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="hour" stroke="#9ca3af" tick={{fontSize: 10}} interval={3} />
                <YAxis stroke="#9ca3af" tick={{fontSize: 10}} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: '#374151', opacity: 0.2}} />
                <Bar dataKey="count" fill="#06b6d4" radius={[2, 2, 0, 0]} name={t.detectCount} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demographics (Mixed Chart) */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex flex-col">
          <h3 className="text-lg font-bold mb-4 text-gray-200">{t.chartDemographics}</h3>
          <div className="h-64 flex-1 relative flex gap-2">
             {/* Age Bar */}
             <div className="flex-1 h-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ageGroups} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                        <XAxis type="number" stroke="#9ca3af" tick={{fontSize: 10}} hide />
                        <YAxis dataKey="name" type="category" stroke="#9ca3af" tick={{fontSize: 10}} width={40} />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: '#374151', opacity: 0.2}} />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name={t.ageGroup} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
             </div>
             
             {/* Gender Donut */}
             <div className="w-1/3 h-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="120">
                    <PieChart>
                        <Pie
                            data={[
                                { name: t.genders.male, value: maleCount },
                                { name: t.genders.female, value: femaleCount }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={25}
                            outerRadius={40}
                            fill="#8884d8"
                            dataKey="value"
                            stroke="none"
                        >
                            <Cell fill={COLORS.male} />
                            <Cell fill={COLORS.female} />
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                <div className="text-[10px] text-gray-400 text-center mt-[-10px]">{t.kpiGender}</div>
             </div>
          </div>
        </div>
      </div>

      {/* CHARTS ROW 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
           {/* Emotion Analysis */}
           <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex flex-col">
              <h3 className="text-lg font-bold mb-4 text-gray-200">{t.chartEmotions}</h3>
              <div className="h-48 flex-1 relative">
                {emotionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={emotionData}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={60}
                                fill="#8884d8"
                                dataKey="value"
                                stroke="none"
                            >
                                {emotionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS.pie[index % COLORS.pie.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                        {t.waitingData}
                    </div>
                )}
              </div>
           </div>
           
           {/* Top Visitors (Existing logic but smaller) */}
           <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex flex-col">
              <h3 className="text-lg font-bold mb-4 text-gray-200">{t.chartFreq}</h3>
              <div className="h-48 flex-1 relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={
                        Object.entries(logs.reduce((acc, log) => {
                            const name = log.isUnknown ? t.unknown : log.personName;
                            acc[name] = (acc[name] || 0) + 1;
                            return acc;
                        }, {} as Record<string, number>))
                        .map(([name, count]) => ({ name, count }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 5)
                    }>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis dataKey="name" stroke="#9ca3af" tick={{fontSize: 10}} />
                        <YAxis stroke="#9ca3af" tick={{fontSize: 10}} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: '#374151', opacity: 0.2}} />
                        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name={t.detectCount} />
                    </BarChart>
                </ResponsiveContainer>
              </div>
           </div>
      </div>

      {/* Log Table (Keep existing) */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
        <h3 className="text-lg font-bold mb-4 text-gray-200">{t.tableTitle}</h3>
        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-gray-900 text-gray-200 uppercase font-medium sticky top-0">
              <tr>
                <th className="px-4 py-3">{t.tableTime}</th>
                <th className="px-4 py-3">{t.tableName}</th>
                <th className="px-4 py-3">{t.ageLabel} / {t.genderLabel}</th>
                <th className="px-4 py-3">{t.expressionLabel}</th>
                <th className="px-4 py-3">{t.tableStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-700/50 transition">
                  <td className="px-4 py-3 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td className={`px-4 py-3 font-bold ${log.isUnknown ? 'text-red-400' : 'text-white'}`}>
                      {log.personName}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                     {log.age || '-'} / {log.gender ? (log.gender === 'male' ? 'M' : 'F') : '-'}
                  </td>
                  <td className="px-4 py-3 text-xs capitalize text-yellow-500">
                     {log.expression ? (t.expressions[log.expression as keyof typeof t.expressions] || log.expression) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {log.isUnknown ? (
                        <span className="px-2 py-1 rounded-full bg-red-900/50 text-red-400 text-xs border border-red-800">{t.unknown}</span>
                    ) : (
                        <span className="px-2 py-1 rounded-full bg-green-900/50 text-green-400 text-xs border border-green-800">{t.verified}</span>
                    )}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center italic text-gray-500">{t.noLogs}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataVisualization;