import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

const COLORS = {
  primary: "#3b82f6",
  secondary: "#8b5cf6",
  accent: "#06b6d4",
  success: "#22c55e",
  warning: "#f59e0b",
  muted: "#6b7280",
  laptops: "#3b82f6",
  desktops: "#8b5cf6",
  thinClients: "#22c55e",
  endUserDevices: "#3b82f6",
  supportOps: "#f59e0b",
  licensing: "#22c55e",
  mgmtSecurity: "#06b6d4",
  vdiDaas: "#8b5cf6",
  overhead: "#6b7280",
  derived: "#3b82f6",
  assumed: "#f59e0b",
  vdi: "#8b5cf6",
  nonVdi: "#3b82f6",
};

type EndpointMixData = {
  laptops: number;
  desktops: number;
  thinClients: number;
};

type CategoryData = {
  endUserDevices: number;
  supportOps: number;
  licensing: number;
  mgmtSecurity: number;
  vdiDaas: number;
  overhead: number;
};

type VdiComparisonData = {
  baseCostPerUser: number;
  vdiPlatformCostPerUser: number;
  vdiUserCount: number;
};

type CostSourceData = {
  derived: number;
  assumed: number;
};

const fmtMoney = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const fmtPct = (n: number) => `${Math.round(n)}%`;

const renderPieLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
    >
      {fmtPct(percent * 100)}
    </text>
  );
};

export function EndpointMixChart({ data }: { data: EndpointMixData }) {
  const total = data.laptops + data.desktops + data.thinClients;
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[320px] text-muted-foreground text-sm">
        Enter device counts to see distribution
      </div>
    );
  }

  const chartData = [
    { name: "Laptops", value: data.laptops, color: COLORS.laptops },
    { name: "Desktops", value: data.desktops, color: COLORS.desktops },
    { name: "Thin Clients", value: data.thinClients, color: COLORS.thinClients },
  ].filter((d) => d.value > 0);

  return (
    <div className="w-full" data-testid="chart-endpoint-mix">
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            label={renderPieLabel}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [value.toLocaleString(), "Devices"]}
          />
          <Legend
            layout="horizontal"
            align="center"
            verticalAlign="bottom"
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(value: string, entry: { payload?: { value?: number } }) => {
              const count = entry?.payload?.value ?? 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return `${value} ${pct}%`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CostByCategoryChart({ data }: { data: CategoryData }) {
  const chartData = [
    { name: "Devices", value: data.endUserDevices, fill: COLORS.endUserDevices },
    { name: "Support", value: data.supportOps, fill: COLORS.supportOps },
    { name: "Licensing", value: data.licensing, fill: COLORS.licensing },
    { name: "Mgmt/Sec", value: data.mgmtSecurity, fill: COLORS.mgmtSecurity },
    { name: "VDI/DaaS", value: data.vdiDaas, fill: COLORS.vdiDaas },
    { name: "Overhead", value: data.overhead, fill: COLORS.overhead },
  ];

  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[320px] text-muted-foreground text-sm">
        No cost data available
      </div>
    );
  }

  return (
    <div className="w-full" data-testid="chart-cost-category">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 10 }}>
          <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <YAxis type="category" dataKey="name" width={65} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value: number) => [fmtMoney(value), "Annual"]} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VdiComparisonChart({ data }: { data: VdiComparisonData }) {
  if (data.vdiUserCount === 0) {
    return (
      <div className="flex items-center justify-center h-[320px] text-muted-foreground text-sm" data-testid="chart-vdi-comparison">
        No VDI/DaaS users reported
      </div>
    );
  }

  if (data.baseCostPerUser === 0 && data.vdiPlatformCostPerUser === 0) {
    return (
      <div className="flex items-center justify-center h-[320px] text-muted-foreground text-sm" data-testid="chart-vdi-comparison">
        Enter user count and VDI data to see comparison
      </div>
    );
  }

  const chartData = [
    { name: "Non-VDI User", base: data.baseCostPerUser, platform: 0 },
    { name: "VDI User", base: data.baseCostPerUser, platform: data.vdiPlatformCostPerUser },
  ];

  return (
    <div className="w-full" data-testid="chart-vdi-comparison">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v) => `$${v.toLocaleString()}`} width={75} />
          <Tooltip
            formatter={(value: number, name: string) => [
              fmtMoney(value),
              name === "platform" ? "VDI Platform (incremental)" : "Base Costs (shared)",
            ]}
          />
          <Legend
            formatter={(value: string) =>
              value === "platform" ? "VDI Platform (incremental)" : "Base Costs (shared)"
            }
          />
          <Bar dataKey="base" stackId="cost" fill="#6b7280" />
          <Bar dataKey="platform" stackId="cost" fill="#00B5E2" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CostSourceChart({ data }: { data: CostSourceData }) {
  const total = data.derived + data.assumed;
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[320px] text-muted-foreground text-sm">
        No cost data available
      </div>
    );
  }

  const chartData = [
    { name: "From Inputs", value: data.derived, fill: COLORS.derived },
    { name: "From Assumptions", value: data.assumed, fill: COLORS.assumed },
  ];

  return (
    <div className="w-full" data-testid="chart-cost-source">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={75} />
          <Tooltip formatter={(value: number) => [fmtMoney(value), "Annual"]} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WhereMoneyGoesChart({ data }: { data: CategoryData }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[320px] text-muted-foreground text-sm">
        No cost data available
      </div>
    );
  }

  const chartData = [
    { name: "End-User Devices", value: data.endUserDevices, color: COLORS.endUserDevices },
    { name: "Licensing", value: data.licensing, color: COLORS.licensing },
    { name: "Support & Ops", value: data.supportOps, color: COLORS.supportOps },
    { name: "VDI/DaaS", value: data.vdiDaas, color: COLORS.vdiDaas },
    { name: "Mgmt & Security", value: data.mgmtSecurity, color: COLORS.mgmtSecurity },
    { name: "Overhead", value: data.overhead, color: COLORS.overhead },
  ].filter((d) => d.value > 0);

  return (
    <div className="w-full" data-testid="chart-where-money-goes">
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={55}
            outerRadius={95}
            paddingAngle={2}
            dataKey="value"
            label={renderPieLabel}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => [fmtMoney(value), "Annual"]} />
          <Legend
            layout="horizontal"
            align="center"
            verticalAlign="bottom"
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

type WaterfallData = {
  endUserDevices: number;
  supportOps: number;
  licensing: number;
  mgmtSecurity: number;
  vdiDaas: number;
  overhead: number;
  msp: number;
};

export function CostWaterfallChart({ data }: { data: WaterfallData }) {
  const categories = [
    { name: "Devices", value: data.endUserDevices },
    { name: "Support", value: data.supportOps },
    { name: "Licensing", value: data.licensing },
    { name: "Mgmt/Sec", value: data.mgmtSecurity },
    { name: "VDI/DaaS", value: data.vdiDaas },
    { name: "Overhead", value: data.overhead },
    { name: "MSP", value: data.msp },
  ].filter(c => c.value > 0);

  const total = categories.reduce((s, c) => s + c.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[320px] text-muted-foreground text-sm" data-testid="chart-waterfall">
        No cost data available
      </div>
    );
  }

  let running = 0;
  const chartData = categories.map(c => {
    const item = { name: c.name, base: running, increment: c.value, total: 0, isTotal: false };
    running += c.value;
    return item;
  });
  chartData.push({ name: "Total", base: 0, increment: 0, total, isTotal: true });

  return (
    <div className="w-full" data-testid="chart-waterfall">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={75} />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === "total") return [fmtMoney(value), "Total TCO"];
              if (name === "increment") return [fmtMoney(value), "Cost"];
              return [null, null];
            }}
            itemStyle={{ display: "flex" }}
          />
          <Bar dataKey="base" stackId="waterfall" fill="transparent" />
          <Bar dataKey="increment" stackId="waterfall" fill="#1e3a5f" radius={[2, 2, 0, 0]} />
          <Bar dataKey="total" fill="#00B5E2" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

type ProjectionChartData = {
  year1: number;
  year2: number;
  year3: number;
};

export function ProjectionLineChart({ data }: { data: ProjectionChartData }) {
  const chartData = [
    { name: "Year 1", value: data.year1 },
    { name: "Year 2", value: data.year2 },
    { name: "Year 3", value: data.year3 },
  ];

  return (
    <div className="w-full" data-testid="chart-projection">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} width={75} />
          <Tooltip formatter={(value: number) => [fmtMoney(value), "Total TCO"]} />
          <Line type="monotone" dataKey="value" stroke="#1e3a5f" strokeWidth={2} dot={{ fill: "#00B5E2", r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChartCard({
  title,
  description,
  children,
  testId,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <div
      className="rounded-2xl border bg-card/60 p-4"
      data-testid={testId}
    >
      <div className="text-sm font-semibold">{title}</div>
      {description && (
        <div className="text-xs text-muted-foreground mt-1">{description}</div>
      )}
      <div className="mt-3">{children}</div>
    </div>
  );
}
