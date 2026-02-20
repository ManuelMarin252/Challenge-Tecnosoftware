export function Dashboard() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-card rounded-lg shadow-sm border border-border">
          <h2 className="text-xl font-semibold mb-2">Welcome to your Dashboard</h2>
          <p className="text-muted-foreground">Select an option from the sidebar to manage your store.</p>
        </div>
      </div>
    </div>
  );
}
