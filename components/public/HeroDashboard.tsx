export function HeroDashboard() {
  return (
    <div className="w-full h-full min-h-80 bg-surface border border-border rounded-lg overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface-secondary">
        <div className="w-2.5 h-2.5 rounded-full bg-border" />
        <div className="w-2.5 h-2.5 rounded-full bg-border" />
        <div className="w-2.5 h-2.5 rounded-full bg-border" />
        <div className="flex-1 mx-3 h-5 bg-border rounded text-xs flex items-center px-2 text-text-muted">
          <span className="text-[10px]">app.reportrun.ng/dashboard</span>
        </div>
      </div>

      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-10 bg-navy-600 flex flex-col items-center py-3 gap-3 shrink-0">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-5 h-5 rounded ${i === 0 ? "bg-white opacity-90" : "bg-navy-500"}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-3 overflow-hidden bg-surface-secondary">
          {/* Stat row */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: "Students", value: "616" },
              { label: "Collection", value: "74%" },
              { label: "Staff", value: "42" },
            ].map((stat) => (
              <div key={stat.label} className="bg-surface border border-border rounded p-2">
                <p className="text-[9px] text-text-muted uppercase tracking-wide">{stat.label}</p>
                <p className="text-sm font-semibold text-navy-600">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Chart area */}
          <div className="bg-surface border border-border rounded p-2 mb-3">
            <p className="text-[9px] text-text-muted mb-2 uppercase tracking-wide">Fee Collection</p>
            <div className="flex items-end gap-1 h-14">
              {[65, 87, 94, 75, 59, 38].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end gap-0.5">
                  <div
                    className="w-full bg-navy-200 rounded-sm"
                    style={{ height: `${h * 0.55}px` }}
                  />
                  <div
                    className="w-full bg-navy-600 rounded-sm"
                    style={{ height: `${h * 0.35}px` }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Table rows */}
          <div className="bg-surface border border-border rounded overflow-hidden">
            <div className="flex gap-2 px-2 py-1.5 border-b border-border bg-surface-secondary">
              {["Student", "Class", "Status"].map((h) => (
                <span key={h} className="flex-1 text-[8px] font-semibold text-text-muted uppercase tracking-wide">
                  {h}
                </span>
              ))}
            </div>
            {[
              { name: "Chidera Eze",    cls: "SSS 1", status: "Paid",    color: "bg-success-light text-success" },
              { name: "Abubakar Musa",  cls: "SSS 1", status: "Partial", color: "bg-warning-light text-warning" },
              { name: "Toluwani A.",    cls: "SSS 2", status: "Unpaid",  color: "bg-error-light text-error"   },
            ].map((row) => (
              <div key={row.name} className="flex gap-2 px-2 py-1.5 border-b border-border last:border-0">
                <span className="flex-1 text-[9px] text-text-primary truncate">{row.name}</span>
                <span className="flex-1 text-[9px] text-text-muted">{row.cls}</span>
                <span className={`text-[8px] px-1.5 py-0.5 rounded font-medium ${row.color}`}>
                  {row.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}