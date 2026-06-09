import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lightbulb, BarChart3, CheckCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useStore } from "@/store";

const areaFilterOptions = [
  { value: "", label: "全部测区" },
  { value: "青藏高原东缘测区", label: "青藏高原东缘测区" },
  { value: "华北克拉通测区", label: "华北克拉通测区" },
  { value: "南海北部陆缘测区", label: "南海北部陆缘测区" },
];

export default function Recommend() {
  const navigate = useNavigate();
  const { recommendations, fetchRecommendations, applyRecommendation, fetchWeights, weightPresets } = useStore();
  const [areaFilter, setAreaFilter] = useState("");

  useEffect(() => {
    fetchRecommendations();
    fetchWeights();
  }, [fetchRecommendations, fetchWeights]);

  const handleAreaChange = (area: string) => {
    setAreaFilter(area);
    if (area) {
      fetchRecommendations(area);
      fetchWeights(area);
    } else {
      fetchRecommendations();
      fetchWeights();
    }
  };

  const handleApply = (rec: typeof recommendations[0]) => {
    applyRecommendation(rec);
    const params = new URLSearchParams();
    if (rec.surveyArea) params.set("surveyArea", rec.surveyArea);
    if (rec.algorithm) params.set("algorithm", rec.algorithm);
    if (rec.weights.regularization) params.set("regularization", String(rec.weights.regularization));
    navigate(`/tasks?${params.toString()}`);
  };

  const groupedByArea = recommendations.reduce<Record<string, typeof recommendations>>((acc, rec) => {
    const area = rec.surveyArea || "其他";
    if (!acc[area]) acc[area] = [];
    acc[area].push(rec);
    return acc;
  }, {});

  const chartData = recommendations.slice(0, 8).map((rec) => ({
    name: rec.name.length > 6 ? rec.name.substring(0, 6) + "…" : rec.name,
    匹配度: rec.matchScore,
    成功率: rec.successRate,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-geo-text">智能推荐</h1>
        <select
          value={areaFilter}
          onChange={(e) => handleAreaChange(e.target.value)}
          className="bg-geo-card border border-slate-700/50 text-geo-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-geo-accent"
        >
          {areaFilterOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {Object.entries(groupedByArea).map(([area, recs]) => (
        <div key={area}>
          <h2 className="text-sm font-medium text-geo-text-secondary mb-3">{area}</h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {recs.map((rec) => (
              <div key={rec.id} className="gradient-card rounded-lg border border-slate-700/50 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-geo-accent" />
                    <h3 className="text-sm font-medium text-geo-text">{rec.name}</h3>
                  </div>
                  {rec.applied && (
                    <span className="flex items-center gap-1 text-xs text-geo-success">
                      <CheckCircle className="w-3 h-3" /> 已应用
                    </span>
                  )}
                </div>
                <p className="text-xs text-geo-text-secondary mb-3">{rec.description}</p>
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                  <div className="bg-geo-secondary/50 rounded-lg px-2 py-1.5">
                    <span className="text-geo-text-secondary">算法：</span>
                    <span className="text-geo-text font-medium">{rec.algorithm || "-"}</span>
                  </div>
                  <div className="bg-geo-secondary/50 rounded-lg px-2 py-1.5">
                    <span className="text-geo-text-secondary">正则化：</span>
                    <span className="text-geo-accent font-mono">{rec.weights.regularization}</span>
                  </div>
                </div>
                {rec.confidence !== undefined && (
                  <div className="mb-3 text-xs bg-geo-secondary/50 rounded-lg px-2 py-1.5">
                    <span className="text-geo-text-secondary">置信度：</span>
                    <span className="text-geo-accent font-mono">{rec.confidence}%</span>
                    {rec.reason && (
                      <p className="text-geo-text-secondary mt-1">{rec.reason}</p>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-geo-secondary/50 rounded-lg p-3 text-center">
                    <div className="text-xs text-geo-text-secondary mb-1">匹配度</div>
                    <div className="text-lg font-bold font-mono text-geo-accent">{rec.matchScore}%</div>
                  </div>
                  <div className="bg-geo-secondary/50 rounded-lg p-3 text-center">
                    <div className="text-xs text-geo-text-secondary mb-1">成功率</div>
                    <div className="text-lg font-bold font-mono text-geo-success">{rec.successRate}%</div>
                  </div>
                </div>
                {!rec.applied && (
                  <button
                    onClick={() => handleApply(rec)}
                    className="w-full px-4 py-2 gradient-accent text-white text-sm rounded-lg hover:opacity-90 transition-opacity"
                  >
                    应用推荐
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {recommendations.length === 0 && (
        <div className="py-12 text-center text-sm text-geo-muted">暂无推荐数据</div>
      )}

      <div className="gradient-card rounded-lg border border-slate-700/50 p-5">
        <h2 className="text-sm font-medium text-geo-text mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-geo-accent" />
          权重推荐
        </h2>
        {weightPresets.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left text-xs font-medium text-geo-text-secondary px-4 py-2">推荐模型</th>
                <th className="text-left text-xs font-medium text-geo-text-secondary px-4 py-2">测区</th>
                <th className="text-left text-xs font-medium text-geo-text-secondary px-4 py-2">拟合差权重</th>
                <th className="text-left text-xs font-medium text-geo-text-secondary px-4 py-2">粗糙度权重</th>
                <th className="text-left text-xs font-medium text-geo-text-secondary px-4 py-2">描述</th>
              </tr>
            </thead>
            <tbody>
              {weightPresets.map((preset, i) => (
                <tr key={i} className="border-b border-slate-700/30">
                  <td className="px-4 py-2.5 text-sm text-geo-text">{preset.name || `预设${i + 1}`}</td>
                  <td className="px-4 py-2.5 text-sm text-geo-text-secondary">{preset.surveyArea || "-"}</td>
                  <td className="px-4 py-2.5 text-sm font-mono text-geo-accent">{preset.misfit}</td>
                  <td className="px-4 py-2.5 text-sm font-mono text-geo-success">{preset.roughness}</td>
                  <td className="px-4 py-2.5 text-xs text-geo-text-secondary">{preset.description || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-geo-muted text-center py-4">暂无权重数据</p>
        )}
      </div>

      <div className="gradient-card rounded-lg border border-slate-700/50 p-5">
        <h2 className="text-sm font-medium text-geo-text mb-4">推荐匹配度与成功率对比</h2>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 11 }} stroke="#1e3a5f" />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} stroke="#1e3a5f" />
              <Tooltip contentStyle={{ backgroundColor: "#152238", border: "1px solid #334155", borderRadius: "8px", color: "#E2E8F0" }} />
              <Legend />
              <Bar dataKey="匹配度" fill="#E8702A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="成功率" fill="#22C55E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[280px] text-geo-muted text-sm">暂无对比数据</div>
        )}
      </div>
    </div>
  );
}
