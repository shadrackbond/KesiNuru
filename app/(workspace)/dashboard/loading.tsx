export default function DashboardLoading() {
  return <div className="mx-auto max-w-6xl animate-pulse"><div className="h-4 w-36 rounded bg-sand" /><div className="mt-4 h-12 w-64 rounded bg-sand" /><div className="mt-10 grid gap-5 md:grid-cols-2">{[1, 2].map((item) => <div key={item} className="h-64 rounded-3xl bg-white" />)}</div></div>;
}
