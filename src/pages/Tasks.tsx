import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, X, Plus, Upload, AlertCircle, CheckCircle } from "lucide-react";
import { useStore } from "@/store";
import StatusBadge from "@/components/StatusBadge";

const statusOptions = [
  { value: "", label: "全部状态" },
  { value: "pending_check", label: "待审核" },
  { value: "preprocessing", label: "预处理" },
  { value: "impedance_calc", label: "阻抗计算" },
  { value: "inversion_iter", label: "反演迭代" },
  { value: "image_gen", label: "成图生成" },
  { value: "completed", label: "已完成" },
  { value: "rollback", label: "已回滚" },
];

const areaOptions = [
  { value: "", label: "全部测区" },
  { value: "青藏高原东缘测区", label: "青藏高原东缘测区" },
  { value: "华北克拉通测区", label: "华北克拉通测区" },
  { value: "南海北部陆缘测区", label: "南海北部陆缘测区" },
];

const algorithmOptions = [
  { value: "Occam反演", label: "Occam反演" },
  { value: "NLCG反演", label: "NLCG反演" },
  { value: "RRI反演", label: "RRI反演" },
  { value: "Rebocc反演", label: "Rebocc反演" },
];

export default function Tasks() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tasks, taskFilters, setTaskFilters, fetchTasks, createTask, surveyAreaStatus, fetchSurveyAreaStatus, fetchAlerts, alerts, selectedRecommendation } = useStore();
  const [showUpload, setShowUpload] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [formName, setFormName] = useState("");
  const [formArea, setFormArea] = useState("");
  const [formLine, setFormLine] = useState("");
  const [formFreq, setFormFreq] = useState("");
  const [formStations, setFormStations] = useState("");
  const [formAlgorithm, setFormAlgorithm] = useState("Occam反演");
  const [formReg, setFormReg] = useState("3.5");
  const [formDesc, setFormDesc] = useState("");
  const [formFiles, setFormFiles] = useState<File[]>([]);
  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTasks();
    fetchAlerts().then(() => fetchSurveyAreaStatus());
  }, [fetchTasks, fetchAlerts, fetchSurveyAreaStatus]);

  useEffect(() => {
    if (selectedRecommendation) {
      setFormAlgorithm(selectedRecommendation.algorithm || "Occam反演");
      setFormReg(String(selectedRecommendation.weights.regularization || 3.5));
      if (selectedRecommendation.surveyArea) {
        setFormArea(selectedRecommendation.surveyArea);
      }
      setShowUpload(true);
    }
  }, [selectedRecommendation]);

  useEffect(() => {
    const prefillArea = searchParams.get("surveyArea");
    const prefillAlgo = searchParams.get("algorithm");
    const prefillReg = searchParams.get("regularization");
    if (prefillArea || prefillAlgo || prefillReg) {
      if (prefillArea) setFormArea(prefillArea);
      if (prefillAlgo) setFormAlgorithm(prefillAlgo);
      if (prefillReg) setFormReg(prefillReg);
      setShowUpload(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const filtered = tasks.filter((t) => {
    if (taskFilters.status && t.status !== taskFilters.status) return false;
    if (taskFilters.surveyArea && t.surveyArea !== taskFilters.surveyArea) return false;
    if (taskFilters.search && !t.name.toLowerCase().includes(taskFilters.search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormFiles(Array.from(e.target.files));
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormArea("");
    setFormLine("");
    setFormFreq("");
    setFormStations("");
    setFormAlgorithm("Occam反演");
    setFormReg("3.5");
    setFormDesc("");
    setFormFiles([]);
    setFormError("");
    setFormSubmitting(false);
  };

  const isAreaPaused = (area: string): boolean => {
    const status = surveyAreaStatus.find((s) => s.name === area);
    if (status?.paused) return true;
    const falseAnomalyCount = alerts.filter(
      (a) => a.surveyArea === area && !a.processed && a.type === "假异常检测"
    ).length;
    return falseAnomalyCount >= 3;
  };

  const handleSubmit = async () => {
    setFormError("");
    if (!formName.trim()) { setFormError("请输入任务名称"); return; }
    if (!formArea) { setFormError("请选择测区"); return; }
    if (!formAlgorithm) { setFormError("请选择反演算法"); return; }
    const regVal = parseFloat(formReg);
    if (isNaN(regVal)) { setFormError("正则化参数必须为数字"); return; }
    const stationVal = parseInt(formStations) || 0;

    if (isAreaPaused(formArea)) {
      setFormError("该测区已暂停，无法创建新任务，请联系首席科学家");
      return;
    }

    setFormSubmitting(true);
    try {
      const files = formFiles.map((f) => ({
        name: f.name,
        size: f.size,
        uploadedAt: new Date().toISOString(),
      }));
      const result = await createTask({
        name: formName.trim(),
        surveyArea: formArea,
        algorithm: formAlgorithm,
        regularization: regVal,
        description: formDesc.trim(),
        stationCount: stationVal,
        frequencyRange: formFreq.trim(),
        lineName: formLine.trim(),
        files,
      });
      if (result.success) {
        setShowUpload(false);
        resetForm();
        setToast({ type: "success", msg: "任务创建成功" });
        fetchTasks();
      } else {
        setFormError(result.error || "创建任务失败");
      }
    } catch (err: any) {
      setFormError(err.message || "创建任务失败");
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-[60] flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === "success" ? "bg-geo-success/90 text-white" : "bg-geo-danger/90 text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm">{toast.msg}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-geo-text">任务管理</h1>
        <button
          onClick={() => { resetForm(); setShowUpload(true); }}
          className="flex items-center gap-2 px-4 py-2 gradient-accent text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          新建任务
        </button>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={taskFilters.status}
          onChange={(e) => setTaskFilters({ status: e.target.value })}
          className="bg-geo-card border border-slate-700/50 text-geo-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-geo-accent"
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={taskFilters.surveyArea}
          onChange={(e) => setTaskFilters({ surveyArea: e.target.value })}
          className="bg-geo-card border border-slate-700/50 text-geo-text text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-geo-accent"
        >
          {areaOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-geo-muted" />
          <input
            type="text"
            placeholder="搜索任务名称..."
            value={taskFilters.search}
            onChange={(e) => setTaskFilters({ search: e.target.value })}
            className="w-full bg-geo-card border border-slate-700/50 text-geo-text text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-geo-accent placeholder:text-geo-muted"
          />
        </div>
      </div>

      <div className="gradient-card rounded-lg border border-slate-700/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-left text-xs font-medium text-geo-text-secondary px-5 py-3">任务名称</th>
              <th className="text-left text-xs font-medium text-geo-text-secondary px-5 py-3">测区</th>
              <th className="text-left text-xs font-medium text-geo-text-secondary px-5 py-3">状态</th>
              <th className="text-left text-xs font-medium text-geo-text-secondary px-5 py-3">迭代进度</th>
              <th className="text-left text-xs font-medium text-geo-text-secondary px-5 py-3">拟合差</th>
              <th className="text-left text-xs font-medium text-geo-text-secondary px-5 py-3">创建时间</th>
              <th className="text-left text-xs font-medium text-geo-text-secondary px-5 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((task) => (
              <tr
                key={task.id}
                onClick={() => navigate(`/tasks/${task.id}`)}
                className="border-b border-slate-700/30 hover:bg-slate-700/20 cursor-pointer transition-colors"
              >
                <td className="px-5 py-3 text-sm text-geo-text">{task.name}</td>
                <td className="px-5 py-3 text-sm text-geo-text-secondary">
                  {task.surveyArea}
                  {isAreaPaused(task.surveyArea) && (
                    <span className="ml-1 text-xs text-geo-danger">（已暂停）</span>
                  )}
                </td>
                <td className="px-5 py-3"><StatusBadge status={task.status} /></td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-geo-accent rounded-full"
                        style={{ width: `${task.maxIteration ? (task.iteration / task.maxIteration) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-geo-text-secondary">{task.iteration}/{task.maxIteration}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm font-mono text-geo-text-secondary">{task.misfit || "-"}</td>
                <td className="px-5 py-3 text-sm text-geo-text-secondary">{task.created}</td>
                <td className="px-5 py-3 text-sm text-geo-accent hover:underline">查看</td>
              </tr>
            ))}
          </tbody>
        </table>
        {paged.length === 0 && (
          <div className="py-8 text-center text-sm text-geo-muted">暂无任务数据</div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-geo-text-secondary">共 {filtered.length} 条记录</span>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 bg-geo-card border border-slate-700/50 rounded-lg text-geo-text-secondary disabled:opacity-40 hover:text-geo-text"
          >
            上一页
          </button>
          <span className="text-geo-text-secondary font-mono">{page}/{totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 bg-geo-card border border-slate-700/50 rounded-lg text-geo-text-secondary disabled:opacity-40 hover:text-geo-text"
          >
            下一页
          </button>
        </div>
      </div>

      {showUpload && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-geo-card border border-slate-700/50 rounded-xl w-[580px] max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-medium text-geo-text">新建反演任务</h2>
              <button onClick={() => { setShowUpload(false); resetForm(); }} className="text-geo-muted hover:text-geo-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-geo-danger/10 border border-geo-danger/20 text-sm text-geo-danger">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {formError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs text-geo-text-secondary block mb-1">数据文件</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-geo-accent/50 transition-colors cursor-pointer"
                >
                  <Upload className="w-6 h-6 text-geo-muted mx-auto mb-2" />
                  <p className="text-sm text-geo-text-secondary">点击上传文件</p>
                  <p className="text-xs text-geo-muted mt-1">支持 .edi .j .png .ts 格式</p>
                  {formFiles.length > 0 && (
                    <div className="mt-2">
                      {formFiles.map((f) => (
                        <p key={f.name} className="text-xs text-geo-accent">{f.name}</p>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept=".edi,.j,.png,.ts"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-geo-text-secondary block mb-1">任务名称</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="输入任务名称"
                    className="w-full bg-geo-secondary border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-geo-text focus:outline-none focus:border-geo-accent placeholder:text-geo-muted"
                  />
                </div>
                <div>
                  <label className="text-xs text-geo-text-secondary block mb-1">测区</label>
                  <select
                    value={formArea}
                    onChange={(e) => {
                      setFormArea(e.target.value);
                      if (e.target.value && isAreaPaused(e.target.value)) {
                        setFormError("该测区已暂停，无法创建新任务，请联系首席科学家");
                      } else if (formError?.includes("暂停")) {
                        setFormError("");
                      }
                    }}
                    className="w-full bg-geo-secondary border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-geo-text focus:outline-none focus:border-geo-accent"
                  >
                    <option value="">请选择测区</option>
                    {areaOptions.filter(o => o.value).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}{isAreaPaused(o.value) ? "（已暂停）" : ""}
                      </option>
                    ))}
                  </select>
                  {formArea && isAreaPaused(formArea) && (
                    <p className="mt-1 text-xs text-geo-danger flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> 该测区已暂停，无法提交新任务
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-geo-text-secondary block mb-1">测线</label>
                  <input
                    type="text"
                    value={formLine}
                    onChange={(e) => setFormLine(e.target.value)}
                    placeholder="输入测线编号"
                    className="w-full bg-geo-secondary border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-geo-text focus:outline-none focus:border-geo-accent placeholder:text-geo-muted"
                  />
                </div>
                <div>
                  <label className="text-xs text-geo-text-secondary block mb-1">频段范围</label>
                  <input
                    type="text"
                    value={formFreq}
                    onChange={(e) => setFormFreq(e.target.value)}
                    placeholder="例如 0.001-1000Hz"
                    className="w-full bg-geo-secondary border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-geo-text focus:outline-none focus:border-geo-accent placeholder:text-geo-muted"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-geo-text-secondary block mb-1">测点数</label>
                  <input
                    type="number"
                    value={formStations}
                    onChange={(e) => setFormStations(e.target.value)}
                    placeholder="0"
                    className="w-full bg-geo-secondary border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-geo-text focus:outline-none focus:border-geo-accent placeholder:text-geo-muted"
                  />
                </div>
                <div>
                  <label className="text-xs text-geo-text-secondary block mb-1">反演算法</label>
                  <select
                    value={formAlgorithm}
                    onChange={(e) => setFormAlgorithm(e.target.value)}
                    className="w-full bg-geo-secondary border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-geo-text focus:outline-none focus:border-geo-accent"
                  >
                    {algorithmOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-geo-text-secondary block mb-1">正则化参数</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formReg}
                    onChange={(e) => setFormReg(e.target.value)}
                    className="w-full bg-geo-secondary border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-geo-text focus:outline-none focus:border-geo-accent"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-geo-text-secondary block mb-1">任务描述</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="输入任务描述（可选）"
                  rows={2}
                  className="w-full bg-geo-secondary border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-geo-text focus:outline-none focus:border-geo-accent placeholder:text-geo-muted resize-none"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => { setShowUpload(false); resetForm(); }}
                className="px-4 py-2 text-sm text-geo-text-secondary hover:text-geo-text border border-slate-700/50 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={formSubmitting}
                className="px-4 py-2 text-sm gradient-accent text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {formSubmitting ? "提交中..." : "提交任务"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
