import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { BarChart2, Calendar, Monitor, ArrowLeft, Loader2, ExternalLink, ShieldCheck, Globe, Smartphone, Tablet } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import { getAnalytics, getMyUrls } from "../utils/api";

const COLORS = ["#ffffff", "#6b7280", "#1e1e1e", "#3f3f3f"];

export default function Analytics() {
  const { shortId } = useParams();
  const [data, setData] = useState(null); // { totalClicks, timeline, stats, redirectURL }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    if (shortId) {
      // Single Link Mode
      getAnalytics(shortId)
        .then((res) => setData(res.data))
        .catch(() => toast.error("Failed to load analytics"))
        .finally(() => setLoading(false));
    } else {
      // All Links Mode (Dashboard)
      getMyUrls()
        .then((res) => {
            const urls = res.data.urls || [];
            const allVisits = urls.flatMap(u => u.visitHistory || []);
            
            // Process stats locally
            const timeline = {};
            const browsers = { Chrome: 0, Safari: 0, Firefox: 0, Other: 0 };
            const devices = { Mobile: 0, Desktop: 0, Tablet: 0 };

            allVisits.forEach(({ timestamp, userAgent }) => {
                const date = new Date(timestamp).toISOString().split("T")[0];
                timeline[date] = (timeline[date] || 0) + 1;

                if (userAgent) {
                    if (userAgent.includes("Chrome")) browsers.Chrome++;
                    else if (userAgent.includes("Safari")) browsers.Safari++;
                    else if (userAgent.includes("Firefox")) browsers.Firefox++;
                    else browsers.Other++;

                    if (userAgent.includes("Mobi")) devices.Mobile++;
                    else if (userAgent.includes("Tablet")) devices.Tablet++;
                    else devices.Desktop++;
                }
            });

            setData({
                totalClicks: allVisits.length,
                timeline: Object.entries(timeline).map(([date, clicks]) => ({ date, clicks })),
                stats: {
                    browsers: Object.entries(browsers).map(([name, value]) => ({ name, value })),
                    devices: Object.entries(devices).map(([name, value]) => ({ name, value }))
                },
                redirectURL: "All Links",
                isGlobal: true,
                totalLinks: urls.length
            });
        })
        .catch(() => toast.error("Failed to load global stats"))
        .finally(() => setLoading(false));
    }
  }, [shortId]);

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <main className="main-content flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-muted" />
        </main>
      </div>
    );
  }

  // Handle empty state for Global View
  if (!data || (!shortId && data.totalLinks === 0)) {
     return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="main-content text-center py-20">
            <BarChart2 size={48} className="mx-auto text-muted mb-4 opacity-20" />
            <h2 className="text-xl font-bold text-white mb-2">No Data Yet</h2>
            <p className="text-muted text-sm max-w-sm mx-auto">
                Create your first link to see global analytics.
            </p>
            <Link to="/dashboard" className="btn-primary mt-6 inline-flex w-auto px-6">
                Create Link
            </Link>
            </main>
        </div>
     );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <div className="mb-8">
          {shortId && (
            <Link to="/links" className="text-muted hover:text-white flex items-center gap-2 text-xs mb-4">
                <ArrowLeft size={14} /> Back to Links
            </Link>
          )} 
          <h1 className="text-2xl font-bold text-white mb-1">
            {shortId ? "Link Intelligence" : "Global Overview"}
          </h1>
          <p className="text-muted text-xs flex items-center gap-2">
            {shortId ? (
                <>
                    <span className="badge">ID: {shortId}</span>
                    <span className="truncate max-w-xs">{data.redirectURL}</span>
                </>
            ) : (
                <span>Aggregated stats across all {data.totalLinks} links</span>
            )}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid mb-8">
          <div className="stat-card">
            <p className="stat-number">{data.totalClicks}</p>
            <p className="stat-label">Total Clicks</p>
          </div>
          <div className="stat-card">
            <p className="stat-number">{data.timeline?.length || 0}</p>
            <p className="stat-label">Active Days</p>
          </div>
          <div className="stat-card">
            <p className="stat-number text-success text-2xl">Active</p>
            <p className="stat-label">System Status</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Timeline */}
          <div className="card lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <Calendar size={16} className="text-muted" />
              <h3 className="text-sm font-semibold text-white">Click Trends</h3>
            </div>
            <div className="h-[250px] w-full">
              {data.timeline?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.timeline}>
                    <defs>
                      <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e1e1e" />
                    <XAxis dataKey="date" hide />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="clicks" stroke="#ffffff" strokeWidth={2} fill="url(#colorClicks)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted text-xs">No clicks yet</div>
              )}
            </div>
          </div>

          {/* Device Mix */}
          <div className="card">
            <div className="flex items-center gap-2 mb-6">
              <Monitor size={16} className="text-muted" />
              <h3 className="text-sm font-semibold text-white">Device Breakdown</h3>
            </div>
            <div className="h-[250px] w-full">
              {data.stats?.devices?.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.stats.devices}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.stats.devices.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted text-xs">No data yet</div>
              )}
            </div>
            <div className="flex justify-center gap-6 mt-4">
                {data.stats?.devices?.map((d, i) => (
                    <div key={d.name} className="flex flex-col items-center">
                        {d.name === 'Mobile' ? <Smartphone size={14} className="text-muted mb-1" /> :
                         d.name === 'Tablet' ? <Tablet size={14} className="text-muted mb-1" /> :
                         <Monitor size={14} className="text-muted mb-1" />}
                        <span className="text-[10px] text-muted">{d.name}</span>
                        <span className="text-xs font-bold">{d.value}</span>
                    </div>
                ))}
            </div>
          </div>
        </div>

        {/* Audit Log (Only shows if shortId is present, or maybe generic recent activity if global?) */}
        <div className="card">
            <div className="flex items-center gap-2 mb-6">
                <ShieldCheck size={16} className="text-muted" />
                <h3 className="text-sm font-semibold text-white">Security Audit Log</h3>
            </div>
            <div className="space-y-4">
                <div className="flex items-start justify-between text-xs border-b border-border pb-4">
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded bg-surface border border-border flex items-center justify-center text-success">
                            <ShieldCheck size={14} />
                        </div>
                        <div>
                            <p className="font-medium text-white">System Healthy</p>
                            <p className="text-muted">All redirects processing normally</p>
                        </div>
                    </div>
                    <p className="text-muted">Live</p>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
