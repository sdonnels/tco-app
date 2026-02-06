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
  vdiCostPerUser: number;
  nonVdiCostPerUser: number;
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
  if (data.vdiCostPerUser === 0 && data.nonVdiCostPerUser === 0) {
    return (
      <div className="flex items-center justify-center h-[320px] text-muted-foreground text-sm">
        Enter user count and VDI % to see comparison
      </div>
    );
  }

  const chartData = [
    { name: "Non-VDI User", value: data.nonVdiCostPerUser, fill: COLORS.nonVdi },
    { name: "VDI User", value: data.vdiCostPerUser, fill: COLORS.vdi },
  ];

  return (
    <div className="w-full" data-testid="chart-vdi-comparison">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v) => `$${v.toLocaleString()}`} width={75} />
          <Tooltip formatter={(value: number) => [fmtMoney(value), "Per User/Year"]} />
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
